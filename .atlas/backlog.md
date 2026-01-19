# cashmind Backlog

## TODO

### LOW-012: Implementar onboarding guiado para nuevos usuarios
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Wizard cuando no hay datos suficientes para evaluar
- **Steps:**
  1. Crear componente `components/health/OnboardingWizard.tsx`
  2. Detectar: < 1 ingreso, < 5 gastos, < 3 presupuestos
  3. Mostrar checklist de requisitos con status (completado/pendiente)
  4. Botones para navegar a: agregar ingreso, agregar gastos, definir presupuestos
  5. Mostrar en lugar de métricas cuando needsOnboarding=true
- **Acceptance:** Usuarios nuevos ven wizard con pasos claros para completar datos

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

### MED-011: Crear panel de consejos con botón regenerar
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Panel que muestra consejos de Gemini con opción de regenerar
- **Steps:**
  1. Crear componente `components/health/AdvicePanel.tsx`
  2. Mostrar consejos cacheados en formato lista
  3. Botón "Regenerar consejo" que llama a regenerateAdvice()
  4. Loading state mientras genera
  5. Error state con retry si falla Gemini
  6. Fallback a consejo genérico si no hay cached_advice
- **Acceptance:** Panel muestra consejos y botón regenera correctamente

## DONE

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
