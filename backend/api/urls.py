from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    MeView, LogoutView, RegisterView, health_check,
    PayslipViewSet, TransactionViewSet, BudgetViewSet, GoalViewSet
)

router = DefaultRouter()
router.register(r'payslips', PayslipViewSet, basename='payslip')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'goals', GoalViewSet, basename='goal')

urlpatterns = [
    # Health check
    path('health/', health_check, name='health-check'),

    # Auth
    path('auth/login/', TokenObtainPairView.as_view(), name='token-obtain'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),

    # API routes
    path('', include(router.urls)),
]
