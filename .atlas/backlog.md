# cashmind Backlog

## TODO

### HIGH-003: Crear endpoint API /api/health-score/
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Endpoint que devuelve score actual y las 4 métricas con su status
- **Steps:**
  1. Crear serializer `HealthScoreSerializer` en `api/serializers.py`
  2. Crear view `HealthScoreView` en `api/views.py` que use HealthScoreService
  3. Agregar ruta `GET /api/health-score/` en `api/urls.py`
  4. Manejar caso sin datos suficientes (retornar needs_onboarding: true)
  5. Guardar/actualizar snapshot del mes actual en DB
- **Acceptance:** `GET /api/health-score/` retorna JSON con overall_score, overall_status, y 4 métricas

### MED-004: Agregar método de consejos financieros a GeminiService
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Nuevo método para generar consejos personalizados basados en métricas
- **Steps:**
  1. Agregar método `generate_financial_advice(metrics_data)` en `api/services/gemini.py`
  2. Crear prompt que reciba las 4 métricas con sus valores y status
  3. Instrucciones: generar 2-3 consejos concretos para las métricas en rojo/amarillo
  4. Limitar respuesta a 200 palabras máximo
- **Acceptance:** Método retorna string con consejos relevantes basados en métricas

### MED-005: Crear endpoint API /api/health-score/advice/
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Endpoint para generar/regenerar consejos de Gemini
- **Steps:**
  1. Crear view `HealthScoreAdviceView` en `api/views.py`
  2. POST regenera consejo llamando a GeminiService
  3. Guardar consejo en cached_advice del snapshot actual
  4. GET retorna consejo cacheado si existe, o genera uno nuevo
- **Acceptance:** `POST /api/health-score/advice/` retorna nuevo consejo y lo cachea

### MED-006: Crear hook useHealthScore en frontend
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Hook para fetch de datos de salud financiera
- **Steps:**
  1. Crear `hooks/useHealthScore.ts`
  2. Implementar `fetchHealthScore()` - GET /api/health-score/
  3. Implementar `regenerateAdvice()` - POST /api/health-score/advice/
  4. Manejar estados: loading, error, needsOnboarding, data
  5. Seguir patrón de otros hooks (AbortController, error handling)
- **Acceptance:** Hook exporta data, loading, error, needsOnboarding, regenerateAdvice

### MED-007: Crear widget HealthScoreWidget para dashboard
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Widget visual con semáforo para mostrar en dashboard
- **Steps:**
  1. Crear `components/dashboard/HealthScoreWidget.tsx`
  2. Mostrar círculo con color según overall_status (green=#22c55e, yellow=#eab308, red=#ef4444)
  3. Texto: "Salud Financiera" + estado en español (Excelente/Regular/Necesita Atención)
  4. Estado loading: skeleton circular
  5. Estado error: icono warning con retry
  6. Usar hook useHealthScore
- **Acceptance:** Widget muestra semáforo correcto según status del API

### MED-008: Integrar widget en página de dashboard
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Agregar HealthScoreWidget al dashboard existente con link a detalle
- **Steps:**
  1. Importar HealthScoreWidget en página dashboard
  2. Agregar en grid de widgets existentes
  3. Agregar link "Ver detalle" que navegue a /health
  4. Responsive: full width en mobile, 1/3 en desktop
- **Acceptance:** Dashboard muestra widget de salud financiera con link funcional

### MED-009: Crear página /health con sección de métricas
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Nueva página con header y grid de 4 MetricCards
- **Steps:**
  1. Crear `app/(dashboard)/health/page.tsx`
  2. Header con semáforo grande + score numérico
  3. Crear componente `components/health/MetricCard.tsx`
  4. Grid 2x2 con 4 MetricCards: Ahorro (piggy-bank), Gastos Fijos (home), Presupuesto (target), Tendencia (trending-up/down)
  5. Cada card muestra: semáforo, nombre, valor %, barra de progreso
- **Acceptance:** Página /health muestra 4 cards con métricas del mes actual

### MED-010: Crear gráfica de evolución histórica
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Line chart con evolución del score de últimos 6 meses
- **Steps:**
  1. Crear endpoint `GET /api/health-score/history/` que retorna últimos 6 snapshots
  2. Crear componente `components/health/HistoryChart.tsx` usando Recharts
  3. Eje X: meses, Eje Y: score 0-100
  4. Línea con color según status de cada punto
  5. Empty state si no hay historial
- **Acceptance:** Gráfica muestra evolución con al menos 2 meses de datos

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

### HIGH-002: Implementar servicio de cálculo de métricas de salud financiera
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md
- **Description:** Lógica de negocio para calcular las 4 métricas y score global
- **Steps:**
  1. Crear `api/services/health_score.py` con clase `HealthScoreService`
  2. Implementar `calculate_savings_rate(user, month)` - (ingresos-gastos)/ingresos
  3. Implementar `calculate_fixed_expenses_ratio(user, month)` - categorías: vivienda, servicios, transporte, seguros
  4. Implementar `calculate_budget_adherence(user, month)` - % categorías dentro de presupuesto
  5. Implementar `calculate_trend(user, month)` - comparar con mes anterior
  6. Implementar `calculate_overall_score()` - ponderación 30/25/25/20
  7. Implementar `get_status(score)` - verde>=70, amarillo>=40, rojo<40
- **Acceptance:** Tests unitarios pasan para cada método de cálculo

## DONE

### HIGH-001: Crear modelo HealthScoreSnapshot y migración (2026-01-19) - PR #9
- **Category:** feature
- **Spec:** .atlas/specs/spec-20260119-022238.md

## DELAYED
