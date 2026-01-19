# CashMind - Tu Mente Financiera Personal

Aplicación de gestión de finanzas personales con análisis inteligente de recibos de sueldo mediante IA (Google Gemini). Diseñada para ayudarte a tomar control de tus finanzas con una interfaz moderna, responsiva y fácil de usar.

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| **Backend** | Django 5, Django REST Framework, PostgreSQL, JWT Auth |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| **IA** | Google Gemini 2.5 Flash Lite (OCR de recibos) |
| **Deploy** | Docker, Docker Compose |

---

## Features

### Dashboard Principal
- **Resumen financiero**: Balance total, ingresos y gastos del período
- **Gráfico Ingresos vs Gastos**: Comparativa mensual con barras
- **Gastos por Categoría**: Desglose de gastos en gráfico de torta
- **Ingresos por Categoría**: Desglose de ingresos en gráfico de torta
- **Transacciones Recientes**: Lista de las últimas 5 transacciones
- **Filtro de Período**: Mes actual, año actual, últimos 365 días, o mes específico

### Recibos de Sueldo (Payslips)
- **Subida de recibos**: Arrastra y suelta PDFs o imágenes de recibos
- **Análisis con IA**: Google Gemini extrae automáticamente:
  - Sueldo bruto y neto
  - Deducciones (impuestos, jubilación, obra social, etc.)
  - Bonificaciones (aguinaldo, horas extra, etc.)
  - Empleador y puesto
  - Mes y año del recibo
- **Creación automática**: Al guardar un recibo, se crea automáticamente una transacción de ingreso por el sueldo neto
- **Vista detallada**: Visualiza cada recibo con todas sus deducciones y bonificaciones
- **Eliminación en cascada**: Al eliminar un recibo, se elimina también su transacción asociada

### Transacciones
- **CRUD completo**: Crear, ver, editar y eliminar transacciones
- **Tipos**: Ingresos y gastos
- **Categorías predefinidas**:
  - **Ingresos**: Salario, Freelance, Inversiones, Regalos, Reembolsos, Otros
  - **Gastos**: Alimentación, Transporte, Entretenimiento, Salud, Educación, Servicios, Compras, Vivienda, Otros
- **Transacciones recurrentes**: Marca transacciones como diarias, semanales, mensuales o anuales
- **Notas opcionales**: Agrega detalles adicionales a cada transacción

### Presupuestos (Budgets)
- **Límites por categoría**: Define cuánto quieres gastar máximo en cada categoría
- **Períodos**: Semanal, mensual o anual
- **Seguimiento visual**: Barra de progreso muestra cuánto llevas gastado
- **Alertas visuales**: Indicador cuando te acercas o superas el límite

### Metas de Ahorro (Goals)
- **Define objetivos**: Nombre, monto objetivo y fecha límite opcional
- **Categorías**: Ahorro, Inversión, Deuda, Compra, Emergencia, Otros
- **Aportes**: Agrega dinero a tus metas cuando quieras
- **Progreso visual**: Barra de progreso y porcentaje completado
- **Colores e iconos**: Personaliza cada meta

### Autenticación
- **JWT Auth**: Tokens de acceso y refresh
- **Sesión persistente**: Tokens guardados en localStorage
- **Auto-refresh**: El token se renueva automáticamente antes de expirar
- **Rutas protegidas**: AuthGuard redirige a login si no hay sesión

### UX/UI
- **100% Responsivo**: Funciona perfecto en móvil, tablet y desktop
- **Sidebar colapsable**: En móvil se muestra como sheet lateral
- **Tema oscuro ready**: Estructura preparada para dark mode
- **Filtros intuitivos**: Selector de período con popover y botones rápidos
- **Feedback visual**: Loading states, estados vacíos, y mensajes de error

---

## Desarrollo Local

### Prerequisitos
- Docker y Docker Compose
- API Key de Google Gemini (obtener en [Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/cashmind.git
cd cashmind
```

### 2. Configurar API Key de Gemini

```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:
```env
GOOGLE_GEMINI_API_KEY=tu_api_key_aqui
```

### 3. Levantar con Docker

```bash
docker-compose up --build
```

La app estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin

### 4. Crear usuario administrador

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. Crear usuarios de la app

1. Ir a http://localhost:8000/admin
2. Loguearse con el superusuario
3. Users → Add User
4. Completar username y password

---

## Comandos Útiles

### Docker

```bash
# Levantar servicios
docker-compose up

# Levantar en background
docker-compose up -d

# Reconstruir imágenes
docker-compose up --build

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down

# Limpiar todo (incluye volúmenes)
docker-compose down -v
```

### Backend (Django)

```bash
# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Crear nueva migración
docker-compose exec backend python manage.py makemigrations

# Shell de Django
docker-compose exec backend python manage.py shell

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

### Frontend (Next.js)

```bash
# Desarrollo sin Docker
cd frontend
npm install
npm run dev

# Build de producción
npm run build

# Linting
npm run lint
```

---

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login, retorna access y refresh token |
| POST | `/api/auth/refresh/` | Renovar access token |
| GET | `/api/auth/me/` | Obtener usuario actual |

### Transacciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/transactions/` | Listar transacciones |
| POST | `/api/transactions/` | Crear transacción |
| GET | `/api/transactions/{id}/` | Detalle de transacción |
| PUT | `/api/transactions/{id}/` | Actualizar transacción |
| DELETE | `/api/transactions/{id}/` | Eliminar transacción |
| GET | `/api/transactions/stats/` | Estadísticas (total, ingresos, gastos) |
| GET | `/api/transactions/monthly/` | Datos mensuales para gráfico |
| GET | `/api/transactions/by_category/` | Desglose por categoría |

### Recibos de Sueldo

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/payslips/` | Listar recibos |
| POST | `/api/payslips/` | Crear recibo |
| GET | `/api/payslips/{id}/` | Detalle de recibo |
| DELETE | `/api/payslips/{id}/` | Eliminar recibo |
| POST | `/api/payslips/analyze/` | Analizar imagen/PDF con IA |

### Presupuestos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/budgets/` | Listar presupuestos |
| POST | `/api/budgets/` | Crear presupuesto |
| GET | `/api/budgets/{id}/` | Detalle de presupuesto |
| PUT | `/api/budgets/{id}/` | Actualizar presupuesto |
| DELETE | `/api/budgets/{id}/` | Eliminar presupuesto |

### Metas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/goals/` | Listar metas |
| POST | `/api/goals/` | Crear meta |
| GET | `/api/goals/{id}/` | Detalle de meta |
| PUT | `/api/goals/{id}/` | Actualizar meta |
| DELETE | `/api/goals/{id}/` | Eliminar meta |
| POST | `/api/goals/{id}/contribute/` | Aportar a una meta |

---

## Estructura del Proyecto

```
cashmind/
├── backend/
│   ├── api/
│   │   ├── models.py          # User, Payslip, Transaction, Budget, Goal
│   │   ├── views.py           # ViewSets para cada modelo
│   │   ├── serializers.py     # Serializers de DRF
│   │   ├── urls.py            # Rutas de la API
│   │   └── services/
│   │       └── gemini.py      # Servicio de análisis con Gemini
│   ├── cashmind/
│   │   ├── settings.py        # Configuración de Django
│   │   └── urls.py            # URLs principales
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/      # Página de login
│   │   │   └── (dashboard)/       # Rutas protegidas
│   │   │       ├── dashboard/     # Dashboard principal
│   │   │       ├── transactions/  # Transacciones
│   │   │       ├── payslips/      # Recibos de sueldo
│   │   │       ├── budgets/       # Presupuestos
│   │   │       └── goals/         # Metas
│   │   ├── components/
│   │   │   ├── ui/               # Componentes shadcn/ui
│   │   │   ├── dashboard/        # Charts, StatCard, etc.
│   │   │   ├── layout/           # AppSidebar, Header
│   │   │   ├── payslip/          # PayslipUploader
│   │   │   └── transactions/     # TransactionForm
│   │   ├── hooks/
│   │   │   ├── useTransactions.ts
│   │   │   ├── usePayslips.ts
│   │   │   ├── useBudgets.ts
│   │   │   └── useGoals.ts
│   │   ├── lib/
│   │   │   ├── api.ts           # Cliente HTTP
│   │   │   ├── auth-context.tsx # Contexto de autenticación
│   │   │   ├── events.ts        # Sistema de eventos
│   │   │   └── date-utils.ts    # Utilidades de fechas
│   │   └── types/
│   │       └── index.ts         # Interfaces TypeScript
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
└── README.md
```

---

## Variables de Entorno

### Backend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `SECRET_KEY` | Clave secreta de Django | Sí (prod) |
| `DEBUG` | Modo debug (`True`/`False`) | No (default: True) |
| `DATABASE_URL` | URL de conexión PostgreSQL | Sí (prod) |
| `GOOGLE_GEMINI_API_KEY` | API Key de Gemini | Sí |
| `ALLOWED_HOSTS` | Hosts permitidos | Sí (prod) |
| `CORS_ALLOWED_ORIGINS` | Orígenes CORS permitidos | Sí (prod) |

### Frontend

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | URL base de la API | No (default: localhost:8000) |

---

## Patrones de Diseño

### Cascade Deletes
- `Payslip` → `Deduction`, `Bonus`, `Transaction` (CASCADE)
- Al eliminar un recibo, se eliminan sus deducciones, bonos y la transacción de salario

### Event System
El frontend usa un sistema de eventos para sincronizar componentes:
```typescript
// Después de crear/editar/eliminar
events.emit(EVENTS.TRANSACTION_CHANGED);
events.emit(EVENTS.PAYSLIP_CHANGED);

// Los hooks escuchan y refrescan datos automáticamente
```

### Date Handling
Todas las fechas usan timezone local del usuario:
```typescript
import { formatLocalDate, getLocalToday } from '@/lib/date-utils';

// Nunca usar toISOString() - convierte a UTC
formatLocalDate(new Date()) // "2025-12-01" en zona local
```

---

## Licencia

MIT License - Haz lo que quieras con el código.

<!-- TEST-001: Integration branch flow verification - 2026-01-19 -->
