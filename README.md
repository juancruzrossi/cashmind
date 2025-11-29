# CashMind - Tu Mente Financiera Personal

Una aplicación completa para gestionar tus finanzas personales con análisis inteligente de recibos de sueldo usando IA.

## Características

- **Dashboard Interactivo**: Visualiza tus finanzas con gráficos y métricas en tiempo real
- **Análisis de Recibos con IA**: Sube tu recibo de sueldo (PDF/imagen) y la IA extraerá automáticamente:
  - Salario bruto y neto
  - Deducciones (impuestos, jubilación, obra social, etc.)
  - Bonos y adicionales
  - Información del empleador
- **Gestión de Transacciones**: Registra y categoriza tus ingresos y gastos
- **Presupuestos**: Define límites de gasto por categoría y monitorea tu progreso
- **Metas Financieras**: Establece objetivos de ahorro y sigue tu progreso
- **Reportes Detallados**: Análisis profundo con gráficos interactivos

## Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Recharts
- **Autenticación**: NextAuth.js
- **IA/OCR**: Google Gemini 1.5 Flash
- **Estado**: Zustand con persistencia local

## Instalación

```bash
# Clonar el repositorio
git clone git@github.com:juancruzrossi/cashmind.git
cd cashmind

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Iniciar en desarrollo
npm run dev
```

## Variables de Entorno

```env
AUTH_SECRET=tu_secreto_aqui
AUTH_USERNAME=tu_usuario
AUTH_PASSWORD=tu_contraseña
GOOGLE_GEMINI_API_KEY=tu_api_key_de_gemini
NEXTAUTH_URL=http://localhost:3000
```

## Despliegue en Railway

1. Conecta tu repositorio de GitHub a Railway
2. Configura las variables de entorno en el dashboard de Railway
3. Railway detectará automáticamente la configuración de Next.js

## Licencia

MIT
