import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type || 'application/pdf';

    const prompt = `Analiza este recibo de sueldo/nómina y extrae la siguiente información en formato JSON.
IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional ni markdown.

El JSON debe tener esta estructura exacta:
{
  "employer": "nombre de la empresa o empleador",
  "position": "cargo o puesto del empleado",
  "period": {
    "month": "nombre del mes en español",
    "year": número del año
  },
  "grossSalary": número (salario bruto total),
  "netSalary": número (salario neto a cobrar),
  "deductions": [
    {
      "name": "nombre de la deducción",
      "amount": número,
      "percentage": número o null,
      "category": "tax" | "social_security" | "retirement" | "health" | "other"
    }
  ],
  "bonuses": [
    {
      "name": "nombre del bono/adicional",
      "amount": número,
      "type": "regular" | "performance" | "holiday" | "other"
    }
  ],
  "additionalInfo": {
    "employeeId": "número de empleado si existe",
    "paymentDate": "fecha de pago si existe",
    "bankAccount": "últimos 4 dígitos de cuenta si existe"
  }
}

Notas importantes:
- Todos los montos deben ser números positivos
- Si no encuentras algún dato, usa null
- Las categorías de deducciones son: tax (impuestos), social_security (seguridad social), retirement (jubilación), health (salud), other (otros)
- Los tipos de bonos son: regular, performance (desempeño), holiday (aguinaldo/vacaciones), other
- Analiza cuidadosamente el documento para extraer todos los conceptos de haberes y deducciones`;

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
      config: {
        temperature: 0.1,
        topK: 32,
        topP: 1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    const textContent = response.text;

    if (!textContent) {
      return NextResponse.json(
        { error: 'No content in response' },
        { status: 500 }
      );
    }

    let jsonStr = textContent.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    try {
      const parsedData = JSON.parse(jsonStr);
      return NextResponse.json({
        success: true,
        data: parsedData,
        rawText: textContent,
      });
    } catch {
      return NextResponse.json({
        success: true,
        data: null,
        rawText: textContent,
        parseError: 'Could not parse JSON from response',
      });
    }
  } catch (error) {
    console.error('Error processing payslip:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
