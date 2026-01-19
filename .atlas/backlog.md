# cashmind Backlog

## TODO

### LOW-013: Tests unitarios backend para health score
- **Category:** test
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Tests para servicio y endpoints de health score
- **Steps:**
  1. Crear `api/tests/test_health_score.py`
  2. Tests para cada método de cálculo en HealthScoreService
  3. Tests para endpoint /api/health-score/ (con datos, sin datos)
  4. Tests para endpoint /api/health-score/advice/
  5. Test para caso sin ingresos = rojo automático
- **Acceptance:** `python manage.py test api.tests.test_health_score` pasa

## IN PROGRESS

## DONE

### LOW-012: Implementar onboarding guiado para nuevos usuarios (2026-01-19) - PR #20
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-011: Crear panel de consejos con botón regenerar (2026-01-19) - PR #19
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-010: Crear gráfica de evolución histórica (2026-01-19) - PR #18
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-009: Crear página /health con sección de métricas (2026-01-19) - PR #17
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-008: Integrar widget en página de dashboard (2026-01-19) - PR #16
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-007: Crear widget HealthScoreWidget para dashboard (2026-01-19) - PR #15
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-006: Crear hook useHealthScore en frontend (2026-01-19) - PR #14
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-005: Crear endpoint API /api/health-score/advice/ (2026-01-19) - PR #13
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### MED-004: Agregar método de consejos financieros a GeminiService (2026-01-19) - PR #12
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### HIGH-003: Crear endpoint API /api/health-score/ (2026-01-19) - PR #11
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### HIGH-002: Implementar servicio de cálculo de métricas de salud financiera (2026-01-19) - PR #10
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

### HIGH-001: Crear modelo HealthScoreSnapshot y migración (2026-01-19) - PR #9
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

## DELAYED
