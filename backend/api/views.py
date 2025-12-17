from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Sum, Avg
from django.db import transaction, IntegrityError
from django.utils import timezone
from datetime import timedelta
import json
import logging

from .models import Payslip, Transaction, Budget, Goal, InvitationCode

logger = logging.getLogger(__name__)
from .serializers import (
    UserSerializer, PayslipSerializer, PayslipCreateSerializer,
    TransactionSerializer, BudgetSerializer, GoalSerializer,
    GoalContributeSerializer
)
from .services.gemini import GeminiService

User = get_user_model()


class MeView(APIView):
    """Get current user info"""
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class LogoutView(APIView):
    """Logout and blacklist refresh token"""
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'detail': 'Logout successful'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(APIView):
    """Register new user with invitation code"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        invitation_code = request.data.get('invitation_code', '').strip().upper()
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        email = request.data.get('email', '').strip()

        if not invitation_code:
            return Response(
                {'detail': 'Código de invitación requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not username or not password:
            return Response(
                {'detail': 'Usuario y contraseña son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(password) < 6:
            return Response(
                {'detail': 'La contraseña debe tener al menos 6 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            code = InvitationCode.objects.get(code__iexact=invitation_code)
        except InvitationCode.DoesNotExist:
            return Response(
                {'detail': 'Código de invitación inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if code.is_used:
            return Response(
                {'detail': 'Este código de invitación ya fue utilizado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'detail': 'Este nombre de usuario ya está en uso'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if email and User.objects.filter(email=email).exists():
            return Response(
                {'detail': 'Este email ya está registrado'},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email or ''
            )

            code.is_used = True
            code.used_by = user
            code.used_at = timezone.now()
            code.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'detail': 'Usuario creado exitosamente',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """Health check endpoint for Railway"""
    return Response({'status': 'ok'})


class PayslipViewSet(viewsets.ModelViewSet):
    """ViewSet for Payslip CRUD operations"""
    serializer_class = PayslipSerializer

    def get_queryset(self):
        return Payslip.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'create':
            return PayslipCreateSerializer
        return PayslipSerializer

    def create(self, request, *args, **kwargs):
        """Override create to handle duplicate payslip errors gracefully"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                payslip = serializer.save(user=request.user)
                self._create_transaction_if_requested(request, payslip)

            headers = self.get_success_headers(serializer.data)
            return Response(
                PayslipSerializer(payslip).data,
                status=status.HTTP_201_CREATED,
                headers=headers
            )
        except IntegrityError as e:
            logger.warning(f"Duplicate payslip attempt: user={request.user.id}, month={request.data.get('month')}, year={request.data.get('year')}")
            return Response(
                {'detail': f"Ya existe un recibo para {request.data.get('month')} {request.data.get('year')}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _create_transaction_if_requested(self, request, payslip):
        """Create income transaction from payslip if requested"""
        create_transaction = request.data.get('create_transaction', False)
        if create_transaction not in [True, 'true', 'True', '1']:
            return

        month_map = {
            'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
            'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
            'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
        }

        month_str = payslip.month.lower() if payslip.month else ''
        month_num = month_map.get(month_str, 1)
        transaction_date = f"{payslip.year}-{month_num:02d}-15"

        Transaction.objects.create(
            user=request.user,
            date=transaction_date,
            description=f"Sueldo {payslip.month} {payslip.year}",
            amount=payslip.net_salary,
            type='income',
            category='salary',
            notes=f"Generado desde recibo - {payslip.employer or 'Sin empleador'}",
            payslip=payslip
        )

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def analyze(self, request):
        """Analyze payslip file with Gemini AI"""
        from .services.gemini import GeminiAPIKeyError

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No se proporcionó archivo'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024
        if file.size > max_size:
            return Response({
                'success': False,
                'error': 'El archivo es demasiado grande. Máximo 10MB.'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate mime type
        allowed_types = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
        mime_type = file.content_type or 'application/pdf'
        if mime_type not in allowed_types:
            return Response({
                'success': False,
                'error': f'Tipo de archivo no soportado: {mime_type}. Use PDF o imagen.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_content = file.read()
            gemini_service = GeminiService()
            result = gemini_service.analyze_payslip(file_content, mime_type)

            return Response({
                'success': True,
                'data': result,
                'file_name': file.name
            })
        except GeminiAPIKeyError as e:
            logger.error(f"Gemini API key not configured: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            return Response({
                'success': False,
                'error': 'Error al procesar la respuesta del análisis. Intenta con otro archivo.'
            }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except Exception as e:
            logger.exception(f"Unexpected error analyzing payslip: {e}")
            return Response({
                'success': False,
                'error': 'Error al analizar el recibo. Intenta nuevamente.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for Transaction CRUD operations"""
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user)

        # Filters
        type_filter = self.request.query_params.get('type')
        category = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if type_filter:
            queryset = queryset.filter(type=type_filter)
        if category:
            queryset = queryset.filter(category=category)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = Transaction.objects.filter(user=request.user)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        transactions = queryset

        total_income = transactions.filter(type='income').aggregate(
            total=Sum('amount'))['total'] or 0
        total_expenses = transactions.filter(type='expense').aggregate(
            total=Sum('amount'))['total'] or 0

        net_balance = float(total_income) - float(total_expenses)
        savings_rate = (net_balance / float(total_income) * 100) if total_income > 0 else 0

        # Monthly averages based on months WITH actual transactions
        from django.db.models.functions import TruncMonth

        income_months = transactions.filter(type='income').annotate(
            month=TruncMonth('date')
        ).values('month').distinct().count()

        expense_months = transactions.filter(type='expense').annotate(
            month=TruncMonth('date')
        ).values('month').distinct().count()

        monthly_avg_income = float(total_income) / income_months if income_months > 0 else 0
        monthly_avg_expenses = float(total_expenses) / expense_months if expense_months > 0 else 0

        # Top expense category
        top_category = transactions.filter(type='expense').values('category').annotate(
            total=Sum('amount')).order_by('-total').first()

        # Budget utilization
        budgets = Budget.objects.filter(user=request.user)
        total_budget = budgets.aggregate(total=Sum('limit'))['total'] or 0
        budget_utilization = (float(total_expenses) / float(total_budget) * 100) if total_budget > 0 else 0

        return Response({
            'totalIncome': float(total_income),
            'totalExpenses': float(total_expenses),
            'netBalance': net_balance,
            'savingsRate': round(savings_rate, 2),
            'monthlyAvgIncome': round(monthly_avg_income, 2),
            'monthlyAvgExpenses': round(monthly_avg_expenses, 2),
            'topExpenseCategory': top_category['category'] if top_category else 'N/A',
            'budgetUtilization': round(budget_utilization, 2)
        })

    @action(detail=False, methods=['get'])
    def monthly(self, request):
        """Get monthly data for charts - respects date filters"""
        from datetime import datetime

        MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')

        if start_date_str and end_date_str:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        else:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=180)

        result = []
        current = start_date.replace(day=1)

        while current <= end_date:
            month_start = current
            if current.month == 12:
                month_end = current.replace(year=current.year + 1, month=1, day=1)
            else:
                month_end = current.replace(month=current.month + 1, day=1)

            month_transactions = Transaction.objects.filter(
                user=request.user,
                date__gte=month_start.date(),
                date__lt=month_end.date()
            )

            income = month_transactions.filter(type='income').aggregate(
                total=Sum('amount'))['total'] or 0
            expenses = month_transactions.filter(type='expense').aggregate(
                total=Sum('amount'))['total'] or 0

            month_label = f"{MONTHS_ES[current.month - 1]} {str(current.year)[2:]}"
            result.append({
                'month': month_label,
                'income': float(income),
                'expenses': float(expenses),
                'savings': float(income) - float(expenses)
            })

            if current.month == 12:
                current = current.replace(year=current.year + 1, month=1)
            else:
                current = current.replace(month=current.month + 1)

        return Response(result)

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get category breakdown"""
        type_filter = request.query_params.get('type', 'expense')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        queryset = Transaction.objects.filter(user=request.user, type=type_filter)

        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        else:
            now = timezone.now()
            queryset = queryset.filter(date__gte=now.replace(day=1).date())
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        transactions = queryset

        total = transactions.aggregate(total=Sum('amount'))['total'] or 0
        categories = transactions.values('category').annotate(
            amount=Sum('amount')
        ).order_by('-amount')

        result = []
        for cat in categories:
            percentage = (float(cat['amount']) / float(total) * 100) if total > 0 else 0
            result.append({
                'category': cat['category'],
                'amount': float(cat['amount']),
                'percentage': round(percentage, 2)
            })

        return Response(result)


class BudgetViewSet(viewsets.ModelViewSet):
    """ViewSet for Budget CRUD operations"""
    serializer_class = BudgetSerializer

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GoalViewSet(viewsets.ModelViewSet):
    """ViewSet for Goal CRUD operations"""
    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def contribute(self, request, pk=None):
        """Add contribution to a goal"""
        goal = self.get_object()
        serializer = GoalContributeSerializer(data=request.data)

        if serializer.is_valid():
            amount = serializer.validated_data['amount']
            goal.current_amount += amount
            goal.save()
            return Response(GoalSerializer(goal).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
