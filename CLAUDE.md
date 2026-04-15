# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development (Docker - recommended)
```bash
docker-compose up --build              # Start all services
docker-compose exec backend python manage.py createsuperuser  # Create admin
docker-compose exec backend python manage.py migrate          # Run migrations
docker-compose exec backend python manage.py makemigrations   # Create migration
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
├── backend/          # Django 5 + DRF REST API
├── frontend/         # Next.js 16 + React 19 app
└── docker-compose.yml
```

### Backend (Django 5 + DRF)

**Models** (`api/models.py`):
- `User` - Custom user with `invitation_code` field (required for registration)
- `InvitationCode` - Codes for controlled user registration
- `Payslip` → has many `Deduction`, `Bonus`, `Transaction` (CASCADE)
- `Transaction` - income/expense with optional FK to Payslip
- `Budget` - spending limits per category
- `Goal` - savings targets with contribution tracking

**Key relationships**:
- Deleting a Payslip cascades to its associated Transaction (salary income)
- All models have `user` FK with CASCADE

**Services** (`api/services/gemini.py`):
- `GeminiService` - OCR analysis of payslip PDFs/images using Google Gemini 2.5 Flash Lite
- Uses `paymentDate` (when money is received) not period date

**Auth**: JWT via `djangorestframework-simplejwt`

### Frontend (Next.js 16 + React 19)

**App Router structure**:
- `(auth)/login` - Public login page with gold particle effects
- `(dashboard)/*` - Protected routes (AuthGuard)

**Data layer** (`hooks/`):
- `useTransactions` - CRUD + stats, monthly data, category breakdown
- `usePayslips` - CRUD + AI analysis
- `useBudgets`, `useGoals` - CRUD operations
- All hooks emit events via `lib/events.ts` for cross-component sync

**Event system** (`lib/events.ts`):
- `TRANSACTION_CHANGED`, `PAYSLIP_CHANGED` - Trigger data refresh
- Hooks subscribe to events to auto-refresh

**API client** (`lib/api.ts`):
- Singleton `ApiClient` with JWT auth headers
- Auto-refresh on 401 responses
- Base URL: `NEXT_PUBLIC_API_URL` or `localhost:8000`

**UI**:
- `/components/ui/` - shadcn/ui primitives (Radix-based)
- `/components/dashboard/` - Charts (Recharts), StatCard, PeriodFilter
- Design: Dark theme with gold (#d4a853) accents, solid backgrounds (no transparency)

**Period filtering**:
- Default: `current_month` (not year)
- Types: current_month, current_year, last_365_days, custom_month
- `getDateRange()` returns {startDate, endDate}

## Environment Variables

**Backend** (`backend/.env`):
```
GOOGLE_GEMINI_API_KEY=xxx
```

**Frontend** (optional):
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Key Patterns

1. **Cascade deletes**: Payslip deletion removes associated salary Transaction
2. **Real-time updates**: Use `events.emit(EVENTS.TRANSACTION_CHANGED)` after mutations
3. **Period filtering**: Pass `startDate`/`endDate` to API endpoints
4. **Responsive**: Mobile sidebar via Sheet, breakpoint `lg:` (1024px)
5. **Solid backgrounds**: No glass/transparency effects - use `#121216` for cards, `#16161c` for popovers

## Date Utilities (`lib/date-utils.ts`)

**IMPORTANT**: Never use `toISOString()` - it converts to UTC.

```typescript
import { formatLocalDate, getLocalToday } from '@/lib/date-utils';

formatLocalDate(new Date())  // "2025-12-01" in LOCAL timezone
getLocalToday()              // Today at 00:00 local
```

## Color System

- Primary: `#d4a853` (gold)
- Card background: `#121216` (solid)
- Popover: `#16161c` (solid)
- Income/positive: `text-emerald-400`
- Expense/negative: `text-red-400`
- Neutral: `text-foreground` (white)

## Git Workflow (CRITICAL)

**NEVER push directly to `main`.** Use GitFlow with feature branches.

### Branch Naming
- `feature/...` - New features
- `enhancement/...` - Improvements to existing features
- `fix/...` - Bug fixes
- `migration/...` - Database migrations
- `refactor/...` - Code refactoring

### Workflow
```bash
# 1. Create branch from main
git checkout main
git pull origin main
git checkout -b feature/my-feature

# 2. Make changes and commit with conventional commits
git add .
git commit -m "feat: add new feature"

# 3. Push branch and create PR with GitHub CLI
git push -u origin feature/my-feature
gh pr create --base main --title "feat: add new feature" --body "Description"

# 4. After approval, merge with squash
gh pr merge --squash --delete-branch
```

### Conventional Commits
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

### CRITICAL RULES
1. **NEVER** push directly to `main`
2. **NEVER** include "Co-Authored-By: Claude" in commits
3. **NEVER** reference Claude or AI in commit messages
4. **ALWAYS** use GitHub CLI (`gh`) for PRs
5. **ALWAYS** use squash and merge for PRs
6. **ALWAYS** delete branches after merging

## Specialized Skills and Agents (REQUIRED)

### Development Skills

**ALWAYS** use the available skills for development tasks:

| Skill | Use |
|-------|-----|
| `senior-frontend` | React components, UI/UX, frontend performance, accessibility |
| `senior-backend` | APIs, business logic, query optimization, security |
| `backend-architect` | API design, DB schemas, service architecture |
| `code-reviewer` | Code review before PRs, quality analysis |
| `debugger` | Investigate errors, stack traces, unexpected behavior |
| `performance-engineer` | Optimization, profiling, caching |

### Specialized Agents

**ALWAYS** use the appropriate agent via the `Task` tool:

- `frontend-developer` - To implement React components, UI, and state
- `backend-architect` - To design APIs and schemas
- `debugger` - To investigate bugs and errors
- `code-reviewer` - To review code after significant changes
- `performance-engineer` - For optimizations
- `Explore` - To explore the codebase and answer questions

### UI/UX Design

**CRITICAL**: Maintain visual consistency across the entire project.

Before creating or modifying UI components:
1. Use the `senior-frontend` skill for implementation guidance
2. Follow the defined color system (gold `#d4a853`, solid backgrounds)
3. Maintain existing patterns (dark theme, no transparency)
4. Verify responsiveness (mobile-first, `lg:` breakpoint)

### When to Use Each Tool

```
Frontend Task  → senior-frontend skill + frontend-developer agent
Backend Task   → senior-backend skill + backend-architect agent
Bug/Error      → debugger agent
Code Review    → code-reviewer agent (PROACTIVE after changes)
Code Exploration → Explore agent (DO NOT use Grep/Glob directly)
Planning       → Plan agent or /planner skill
```

## Frontend Testing (agent-browser)

Before completing UI tasks, verify changes visually:

```bash
docker-compose up -d                       # Start services
agent-browser open http://localhost:3000   # Navigate
agent-browser snapshot -i                  # Check interactive elements
agent-browser click @e1                    # Test interactions
agent-browser screenshot /tmp/test.png    # Capture result
agent-browser close                        # Cleanup
```
