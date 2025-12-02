# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development (Docker - recommended)
```bash
# Start all services
docker-compose up --build

# Create superuser
docker-compose exec backend python manage.py createsuperuser

# Run migrations manually
docker-compose exec backend python manage.py migrate

# Create new migration
docker-compose exec backend python manage.py makemigrations
```

### Frontend only
```bash
cd frontend
npm run dev      # Development server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

### Backend only
```bash
cd backend
python manage.py runserver    # Dev server (localhost:8000)
python manage.py test         # Run tests
```

## Architecture

### Monorepo Structure
```
cashmind/
├── backend/          # Django REST API
├── frontend/         # Next.js 16 app
└── docker-compose.yml
```

### Backend (Django 5 + DRF)

**Models** (`api/models.py`):
- `User` - Custom user extending AbstractUser
- `Payslip` → has many `Deduction`, `Bonus`, `Transaction` (CASCADE)
- `Transaction` - income/expense with optional FK to Payslip
- `Budget` - spending limits per category
- `Goal` - savings targets

**Key relationships**:
- Deleting a Payslip cascades to its associated Transaction (salary income)
- All models have `user` FK with CASCADE

**Services** (`api/services/gemini.py`):
- `GeminiService` - OCR analysis of payslip PDFs/images using Google Gemini

**Auth**: JWT via `djangorestframework-simplejwt`

### Frontend (Next.js 16 + React 19)

**App Router structure**:
- `(auth)/login` - Public login page
- `(dashboard)/dashboard/*` - Protected routes (AuthGuard)

**Data layer** (`hooks/`):
- `useTransactions` - CRUD + stats, monthly data, category breakdown
- `usePayslips` - CRUD + analyze with AI
- `useBudgets`, `useGoals` - CRUD operations
- All hooks emit events via `lib/events.ts` for cross-component sync

**Event system** (`lib/events.ts`):
- `TRANSACTION_CHANGED` - Triggers refresh of stats/charts
- `PAYSLIP_CHANGED` - Triggers refresh of payslip list
- Hooks subscribe to events to auto-refresh data

**Auth context** (`lib/auth-context.tsx`):
- Manages JWT tokens (access + refresh)
- Auto-refresh on 401 responses
- Stored in localStorage

**API client** (`lib/api.ts`):
- Singleton `ApiClient` class
- Handles auth headers, token refresh, error handling
- Base URL: `NEXT_PUBLIC_API_URL` or fallback to `localhost:8000`

**UI Components**:
- `/components/ui/` - shadcn/ui primitives (Radix-based)
- `/components/dashboard/` - Charts (Recharts), StatCard, PeriodFilter
- `/components/layout/` - AppSidebar (responsive), Header

**Period filtering**:
- `PeriodFilter` component with types: current_month, current_year, last_365_days, custom_month
- `getDateRange()` returns {startDate, endDate} for API queries

### Type definitions (`types/index.ts`)
- `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES` - Category constants with labels
- `CATEGORY_COLORS` - Color mapping for charts
- `Transaction`, `Payslip`, `Budget`, `Goal` interfaces

## Environment Variables

**Backend** (`backend/.env`):
```
GOOGLE_GEMINI_API_KEY=xxx
```

**Frontend** (optional, has fallback):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Key Patterns

1. **Cascade deletes**: Payslip deletion removes associated salary Transaction
2. **Real-time updates**: Use `events.emit(EVENTS.TRANSACTION_CHANGED)` after mutations
3. **Period filtering**: Pass `startDate`/`endDate` to API endpoints for filtered stats
4. **Responsive**: Mobile sidebar via Sheet, breakpoint `lg:` (1024px) for desktop sidebar
5. **Timezone handling**: Always use `lib/date-utils.ts` for date operations - respects user's local timezone

## Date Utilities (`lib/date-utils.ts`)

**IMPORTANT**: Never use `toISOString()` for date formatting - it converts to UTC.

```typescript
import { formatLocalDate, getLocalToday, parseLocalDate } from '@/lib/date-utils';

// Format date as YYYY-MM-DD in LOCAL timezone
formatLocalDate(new Date())  // "2025-12-01" (respects user's timezone)

// Get today at midnight in local timezone
getLocalToday()

// Parse YYYY-MM-DD as local date (not UTC)
parseLocalDate("2025-12-01")  // Dec 1st at 00:00 local time
```

Available helpers:
- `formatLocalDate(date)` - YYYY-MM-DD in local timezone
- `getLocalToday()` - Today at 00:00 local
- `getLocalMonthStart(date)` - First day of month
- `getLocalMonthEnd(date)` - Last day of month
- `getLocalYearStart(date)` - Jan 1st of year
- `subtractDays(date, n)` - Subtract n days
- `getUserLocale()` - User's navigator.language
- `formatDisplayDate(date)` - Localized display format
- `formatCurrency(value)` - Localized currency format
