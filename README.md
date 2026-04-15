# CashMind - Your Personal Financial Mind

Personal finance management app with intelligent payslip analysis powered by AI (Google Gemini). Designed to help you take control of your finances with a modern, responsive, and easy-to-use interface.

## Tech Stack

| Layer | Technology |
|------|------------|
| **Backend** | Django 5, Django REST Framework, PostgreSQL, JWT Auth |
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| **AI** | Google Gemini 2.5 Flash Lite (payslip OCR) |
| **Deploy** | Docker, Docker Compose |

---

## Features

### Main Dashboard
- **Financial Summary**: Total balance, income, and expenses for the selected period
- **Income vs Expenses Chart**: Monthly comparison with bars
- **Expenses by Category**: Expense breakdown in a pie chart
- **Income by Category**: Income breakdown in a pie chart
- **Recent Transactions**: List of the last 5 transactions
- **Period Filter**: Current month, current year, last 365 days, or a specific month

### Payslips
- **Payslip Upload**: Drag and drop PDFs or payslip images
- **AI Analysis**: Google Gemini automatically extracts:
  - Gross and net salary
  - Deductions (taxes, retirement, health insurance, etc.)
  - Bonuses (annual bonus, overtime, etc.)
  - Employer and role
  - Payslip month and year
- **Automatic Creation**: When a payslip is saved, an income transaction is automatically created for the net salary
- **Detailed View**: View each payslip with all deductions and bonuses
- **Cascade Deletion**: When a payslip is deleted, its associated transaction is also deleted

### Transactions
- **Full CRUD**: Create, view, edit, and delete transactions
- **Types**: Income and expenses
- **Predefined Categories**:
  - **Income**: Salary, Freelance, Investments, Gifts, Refunds, Other
  - **Expenses**: Food, Transportation, Entertainment, Health, Education, Services, Shopping, Housing, Other
- **Recurring Transactions**: Mark transactions as daily, weekly, monthly, or yearly
- **Optional Notes**: Add extra details to each transaction

### Budgets
- **Category Limits**: Define how much you want to spend at most in each category
- **Periods**: Weekly, monthly, or yearly
- **Visual Tracking**: Progress bar shows how much you have spent
- **Visual Alerts**: Indicator when you are close to or over the limit

### Savings Goals
- **Define Goals**: Name, target amount, and optional deadline
- **Categories**: Savings, Investment, Debt, Purchase, Emergency, Other
- **Contributions**: Add money to your goals whenever you want
- **Visual Progress**: Progress bar and completion percentage
- **Colors and Icons**: Customize each goal

### Authentication
- **JWT Auth**: Access and refresh tokens
- **Persistent Session**: Tokens stored in localStorage
- **Auto-refresh**: Token is automatically renewed before expiration
- **Protected Routes**: AuthGuard redirects to login when there is no session

### UX/UI
- **100% Responsive**: Works perfectly on mobile, tablet, and desktop
- **Collapsible Sidebar**: On mobile it is shown as a side sheet
- **Dark Theme Ready**: Structure prepared for dark mode
- **Intuitive Filters**: Period selector with popover and quick buttons
- **Visual Feedback**: Loading states, empty states, and error messages

---

## Local Development

### Prerequisites
- Docker and Docker Compose
- Google Gemini API key (get it from [Google AI Studio](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cashmind.git
cd cashmind
```

### 2. Configure the Gemini API Key

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```env
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### 3. Start with Docker

```bash
docker-compose up --build
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin

### 4. Create an Admin User

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5. Create App Users

1. Go to http://localhost:8000/admin
2. Log in with the superuser
3. Users → Add User
4. Fill in username and password

---

## Useful Commands

### Docker

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Rebuild images
docker-compose up --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean everything (includes volumes)
docker-compose down -v
```

### Backend (Django)

```bash
# Run migrations
docker-compose exec backend python manage.py migrate

# Create a new migration
docker-compose exec backend python manage.py makemigrations

# Django shell
docker-compose exec backend python manage.py shell

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Frontend (Next.js)

```bash
# Development without Docker
cd frontend
npm install
npm run dev

# Production build
npm run build

# Linting
npm run lint
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login, returns access and refresh token |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Get current user |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/` | List transactions |
| POST | `/api/transactions/` | Create transaction |
| GET | `/api/transactions/{id}/` | Transaction detail |
| PUT | `/api/transactions/{id}/` | Update transaction |
| DELETE | `/api/transactions/{id}/` | Delete transaction |
| GET | `/api/transactions/stats/` | Statistics (total, income, expenses) |
| GET | `/api/transactions/monthly/` | Monthly data for the chart |
| GET | `/api/transactions/by_category/` | Breakdown by category |

### Payslips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payslips/` | List payslips |
| POST | `/api/payslips/` | Create payslip |
| GET | `/api/payslips/{id}/` | Payslip detail |
| DELETE | `/api/payslips/{id}/` | Delete payslip |
| POST | `/api/payslips/analyze/` | Analyze image/PDF with AI |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets/` | List budgets |
| POST | `/api/budgets/` | Create budget |
| GET | `/api/budgets/{id}/` | Budget detail |
| PUT | `/api/budgets/{id}/` | Update budget |
| DELETE | `/api/budgets/{id}/` | Delete budget |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals/` | List goals |
| POST | `/api/goals/` | Create goal |
| GET | `/api/goals/{id}/` | Goal detail |
| PUT | `/api/goals/{id}/` | Update goal |
| DELETE | `/api/goals/{id}/` | Delete goal |
| POST | `/api/goals/{id}/contribute/` | Contribute to a goal |

---

## Project Structure

```
cashmind/
├── backend/
│   ├── api/
│   │   ├── models.py          # User, Payslip, Transaction, Budget, Goal
│   │   ├── views.py           # ViewSets for each model
│   │   ├── serializers.py     # DRF serializers
│   │   ├── urls.py            # API routes
│   │   └── services/
│   │       └── gemini.py      # Gemini analysis service
│   ├── cashmind/
│   │   ├── settings.py        # Django settings
│   │   └── urls.py            # Main URLs
│   ├── Dockerfile
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/login/      # Login page
│   │   │   └── (dashboard)/       # Protected routes
│   │   │       ├── dashboard/     # Main dashboard
│   │   │       ├── transactions/  # Transactions
│   │   │       ├── payslips/      # Payslips
│   │   │       ├── budgets/       # Budgets
│   │   │       └── goals/         # Goals
│   │   ├── components/
│   │   │   ├── ui/               # shadcn/ui components
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
│   │   │   ├── api.ts           # HTTP client
│   │   │   ├── auth-context.tsx # Authentication context
│   │   │   ├── events.ts        # Event system
│   │   │   └── date-utils.ts    # Date utilities
│   │   └── types/
│   │       └── index.ts         # TypeScript interfaces
│   ├── Dockerfile
│   ├── package.json
│   └── tailwind.config.ts
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

### Backend

| Variable | Description | Required |
|----------|-------------|----------|
| `SECRET_KEY` | Django secret key | Yes (prod) |
| `DEBUG` | Debug mode (`True`/`False`) | No (default: True) |
| `DATABASE_URL` | PostgreSQL connection URL | Yes (prod) |
| `GOOGLE_GEMINI_API_KEY` | Gemini API key | Yes |
| `ALLOWED_HOSTS` | Allowed hosts | Yes (prod) |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | Yes (prod) |

### Frontend

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | API base URL | No (default: localhost:8000) |

---

## Design Patterns

### Cascade Deletes
- `Payslip` → `Deduction`, `Bonus`, `Transaction` (CASCADE)
- Deleting a payslip also deletes its deductions, bonuses, and salary transaction

### Event System
The frontend uses an event system to keep components synchronized:
```typescript
// After create/edit/delete
events.emit(EVENTS.TRANSACTION_CHANGED);
events.emit(EVENTS.PAYSLIP_CHANGED);

// Hooks listen and refresh data automatically
```

### Date Handling
All dates use the user's local timezone:
```typescript
import { formatLocalDate, getLocalToday } from '@/lib/date-utils';

// Never use toISOString() - it converts to UTC
formatLocalDate(new Date()) // "2025-12-01" in local timezone
```

---

## License

MIT License

<!-- TEST-001: Integration branch flow verification - 2026-01-19 -->
