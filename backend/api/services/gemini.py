import base64
import json
from django.conf import settings
from google import genai


class GeminiService:
    """Service for analyzing payslips using Google Gemini AI"""

    def __init__(self):
        self.client = genai.Client(api_key=settings.GOOGLE_GEMINI_API_KEY)

    def analyze_payslip(self, file_content: bytes, mime_type: str) -> dict:
        """
        Analyze a payslip file and extract structured data.

        Args:
            file_content: The raw bytes of the file
            mime_type: The MIME type of the file (e.g., 'application/pdf', 'image/png')

        Returns:
            dict: Extracted payslip data
        """
        prompt = """Analiza este recibo de sueldo/nómina y extrae la siguiente información en formato JSON.

El JSON debe tener esta estructura exacta:
{
  "employer": "nombre de la empresa o empleador",
  "position": "cargo o puesto del empleado",
  "paymentDate": {
    "month": "nombre del mes en español de la FECHA DE PAGO",
    "year": número del año de la FECHA DE PAGO
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
  ]
}

Notas importantes:
- CRÍTICO: Para "paymentDate", usa la FECHA DE PAGO (cuando se cobra el sueldo), NO el periodo abonado. Por ejemplo, si dice "Fecha de pago: 01/11/2025" y "Periodo abonado: Octubre 2025", el paymentDate debe ser Noviembre 2025.
- Todos los montos deben ser números positivos
- Si no encuentras algún dato, usa null
- Las categorías de deducciones son: tax (impuestos), social_security (seguridad social), retirement (jubilación), health (salud), other (otros)
- Los tipos de bonos son: regular, performance (desempeño), holiday (aguinaldo/vacaciones), other
- Analiza cuidadosamente el documento para extraer todos los conceptos de haberes y deducciones"""

        response = self.client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=[
                {
                    'role': 'user',
                    'parts': [
                        {'text': prompt},
                        {
                            'inline_data': {
                                'mime_type': mime_type,
                                'data': base64.b64encode(file_content).decode()
                            }
                        }
                    ]
                }
            ],
            config={
                'response_mime_type': 'application/json',
                'temperature': 0.1,
                'max_output_tokens': 8192,
            }
        )

        return json.loads(response.text)

    def generate_financial_advice(self, metrics_data: dict) -> str:
        """
        Generate personalized financial advice based on health metrics.

        Args:
            metrics_data: Dictionary containing:
                - savings_rate: {value: float, status: str}
                - fixed_expenses: {value: float, status: str}
                - budget_adherence: {value: float, status: str}
                - trend: {value: float, status: str}
                - overall_status: str

        Returns:
            str: Personalized advice in Spanish (max ~200 words)
        """
        metrics_summary = []

        metrics_info = [
            ('Tasa de Ahorro', metrics_data.get('savings_rate', {})),
            ('Gastos Fijos', metrics_data.get('fixed_expenses', {})),
            ('Diversificación de Gastos', metrics_data.get('expense_diversification', {})),
            ('Tendencia Mensual', metrics_data.get('trend', {})),
        ]

        for name, metric in metrics_info:
            status = metric.get('status', 'green')
            value = metric.get('value', 0)
            status_es = {'red': 'rojo', 'yellow': 'amarillo', 'green': 'verde'}.get(status, status)
            metrics_summary.append(f"- {name}: {value:.1f}% (semáforo: {status_es})")

        metrics_text = '\n'.join(metrics_summary)
        overall_status = metrics_data.get('overall_status', 'green')
        overall_status_es = {'red': 'rojo', 'yellow': 'amarillo', 'green': 'verde'}.get(overall_status, overall_status)

        prompt = f"""Eres un asesor financiero personal. Analiza las siguientes métricas de salud financiera y genera consejos personalizados.

MÉTRICAS DEL USUARIO:
{metrics_text}

Estado general: {overall_status_es}

INSTRUCCIONES:
1. Genera 2-3 consejos CONCRETOS y ACCIONABLES
2. Prioriza consejos para las métricas en rojo o amarillo
3. Si todas están en verde, felicita brevemente y da un consejo para mantener el buen estado
4. Usa un tono amigable pero profesional
5. Sé específico: menciona porcentajes, acciones concretas, tiempos
6. MÁXIMO 200 palabras

CONTEXTO DE MÉTRICAS:
- Tasa de Ahorro: % de ingresos que quedan después de gastos. Verde ≥20%, Amarillo 10-19%, Rojo <10%
- Gastos Fijos: % de ingresos en vivienda, servicios, transporte, seguros. Verde ≤40%, Amarillo 41-55%, Rojo >55%
- Diversificación de Gastos: qué tan distribuidos están tus gastos entre categorías. Verde ≥60%, Amarillo 40-59%, Rojo <40%
- Tendencia Mensual: mejora/empeora vs mes anterior. Verde: mejora ≥5%, Amarillo: empeora 0-10%, Rojo: empeora >10%

Responde SOLO con los consejos, sin introducción ni despedida."""

        response = self.client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=[
                {
                    'role': 'user',
                    'parts': [{'text': prompt}]
                }
            ],
            config={
                'temperature': 0.7,
                'max_output_tokens': 512,
            }
        )

        return response.text.strip()
