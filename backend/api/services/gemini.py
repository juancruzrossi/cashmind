import base64
import json
import logging
from django.conf import settings
from google import genai

logger = logging.getLogger(__name__)


class GeminiAPIKeyError(Exception):
    """Raised when Gemini API key is not configured"""
    pass


class GeminiService:
    """Service for analyzing payslips using Google Gemini AI"""

    def __init__(self):
        api_key = settings.GOOGLE_GEMINI_API_KEY
        if not api_key:
            logger.error("GOOGLE_GEMINI_API_KEY environment variable is not set")
            raise GeminiAPIKeyError("El servicio de análisis de recibos no está configurado. Contacta al administrador.")
        self.client = genai.Client(api_key=api_key)

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
