from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db.models import Sum, Avg
from django.db import transaction
from django.utils import timezone
from datetime import timedelta, date
import json

from .models import Payslip, Transaction, Budget, Goal, InvitationCode, HealthScoreSnapshot
from .serializers import (
    UserSerializer, PayslipSerializer, PayslipCreateSerializer,
    TransactionSerializer, BudgetSerializer, GoalSerializer,
    GoalContributeSerializer, HealthScoreSerializer
)
from .services.gemini import GeminiService
from .services.chat import ChatService
from .services.health_score import HealthScoreService

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

    def perform_create(self, serializer):
        payslip = serializer.save(user=self.request.user)

        # Optionally create income transaction
        create_transaction = self.request.data.get('create_transaction', False)
        if create_transaction in [True, 'true', 'True', '1']:
            month_map = {
                'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4,
                'mayo': 5, 'junio': 6, 'julio': 7, 'agosto': 8,
                'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
            }
            month_num = month_map.get(payslip.month.lower(), 1)
            transaction_date = f"{payslip.year}-{month_num:02d}-15"

            Transaction.objects.create(
                user=self.request.user,
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
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            file_content = file.read()
            mime_type = file.content_type or 'application/pdf'

            gemini_service = GeminiService()
            result = gemini_service.analyze_payslip(file_content, mime_type)

            return Response({
                'success': True,
                'data': result,
                'file_name': file.name
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
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


class ChatInterpretView(APIView):
    """Interpret user message for chatbot NLU"""

    def post(self, request):
        message = request.data.get('message', '').strip()
        context = request.data.get('context')
        collected_data = request.data.get('collected_data', {})

        if not message:
            return Response(
                {'error': 'Message is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(message) > 500:
            return Response(
                {'error': 'Message too long (max 500 characters)'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            chat_service = ChatService()
            result = chat_service.interpret_message(message, context, collected_data)
            return Response(result)
        except Exception as e:
            return Response(
                {
                    'intent': 'unknown',
                    'extractedData': None,
                    'missingFields': [],
                    'response': 'Perdón, hubo un error. ¿Podés intentar de nuevo?',
                    'isComplete': False
                },
                status=status.HTTP_200_OK
            )


class ChatAnalyzeReceiptView(APIView):
    """Analyze receipt image for chatbot"""
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response(
                {'success': False, 'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        allowed_types = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
        if file.content_type not in allowed_types:
            return Response(
                {'success': False, 'error': 'Tipo de archivo no válido. Usá JPG, PNG o WebP.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if file.size > 5 * 1024 * 1024:
            return Response(
                {'success': False, 'error': 'Archivo muy grande. Máximo 5MB.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            file_content = file.read()
            chat_service = ChatService()
            result = chat_service.analyze_receipt(file_content, file.content_type)
            return Response(result)
        except Exception as e:
            return Response(
                {'success': False, 'error': 'No pude analizar la imagen. Intentá con otra foto.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class HealthScoreView(APIView):
    """Get current month's financial health score"""

    def get(self, request):
        current_month = date.today().replace(day=1)

        service = HealthScoreService()
        result = service.calculate_health_score(request.user, current_month)

        # Save/update snapshot for current month
        snapshot, created = HealthScoreSnapshot.objects.update_or_create(
            user=request.user,
            month=current_month,
            defaults={
                'savings_rate_score': result.savings_rate.score,
                'fixed_expenses_score': result.fixed_expenses.score,
                'expense_diversification_score': result.expense_diversification.score,
                'trend_score': result.trend.score,
                'overall_score': result.overall_score,
                'overall_status': result.overall_status,
            }
        )

        response_data = {
            'overall_score': result.overall_score,
            'overall_status': result.overall_status,
            'needs_onboarding': result.needs_onboarding,
            'savings_rate': {
                'value': float(result.savings_rate.value),
                'score': result.savings_rate.score,
                'status': result.savings_rate.status,
            },
            'fixed_expenses': {
                'value': float(result.fixed_expenses.value),
                'score': result.fixed_expenses.score,
                'status': result.fixed_expenses.status,
            },
            'expense_diversification': {
                'value': float(result.expense_diversification.value),
                'score': result.expense_diversification.score,
                'status': result.expense_diversification.status,
            },
            'trend': {
                'value': float(result.trend.value),
                'score': result.trend.score,
                'status': result.trend.status,
            },
            'month': current_month.isoformat(),
        }

        if result.onboarding_status:
            response_data['onboarding_status'] = {
                'income_count': result.onboarding_status.income_count,
                'expense_count': result.onboarding_status.expense_count,
                'income_required': result.onboarding_status.income_required,
                'expense_required': result.onboarding_status.expense_required,
            }

        return Response(response_data)


class HealthScoreAdviceView(APIView):
    """Generate and retrieve financial advice for health score"""

    def get(self, request):
        """Get cached advice or generate new one if not exists"""
        current_month = date.today().replace(day=1)

        try:
            snapshot = HealthScoreSnapshot.objects.get(
                user=request.user,
                month=current_month
            )
        except HealthScoreSnapshot.DoesNotExist:
            return Response(
                {'error': 'No hay evaluación de salud financiera para este mes. Visita /health-score/ primero.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if snapshot.cached_advice:
            return Response({
                'advice': snapshot.cached_advice,
                'generated_at': snapshot.advice_generated_at,
                'cached': True
            })

        # Generate new advice
        return self._generate_and_cache_advice(request.user, snapshot)

    def post(self, request):
        """Regenerate advice regardless of cache"""
        current_month = date.today().replace(day=1)

        try:
            snapshot = HealthScoreSnapshot.objects.get(
                user=request.user,
                month=current_month
            )
        except HealthScoreSnapshot.DoesNotExist:
            return Response(
                {'error': 'No hay evaluación de salud financiera para este mes. Visita /health-score/ primero.'},
                status=status.HTTP_404_NOT_FOUND
            )

        return self._generate_and_cache_advice(request.user, snapshot)

    def _generate_and_cache_advice(self, user, snapshot):
        """Generate advice using Gemini and cache it in the snapshot"""
        service = HealthScoreService()
        result = service.calculate_health_score(user, snapshot.month)

        metrics_data = {
            'savings_rate': {
                'value': float(result.savings_rate.value),
                'status': result.savings_rate.status,
            },
            'fixed_expenses': {
                'value': float(result.fixed_expenses.value),
                'status': result.fixed_expenses.status,
            },
            'expense_diversification': {
                'value': float(result.expense_diversification.value),
                'status': result.expense_diversification.status,
            },
            'trend': {
                'value': float(result.trend.value),
                'status': result.trend.status,
            },
            'overall_status': result.overall_status,
        }

        try:
            gemini_service = GeminiService()
            advice = gemini_service.generate_financial_advice(metrics_data)
        except Exception as e:
            return Response(
                {'error': f'Error al generar consejo: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        snapshot.cached_advice = advice
        snapshot.advice_generated_at = timezone.now()
        snapshot.save()

        return Response({
            'advice': advice,
            'generated_at': snapshot.advice_generated_at,
            'cached': False
        })


class HealthScoreHistoryView(APIView):
    """Get health score history for the last 6 months"""

    def get(self, request):
        from dateutil.relativedelta import relativedelta

        current_month = date.today().replace(day=1)
        six_months_ago = current_month - relativedelta(months=5)

        snapshots = HealthScoreSnapshot.objects.filter(
            user=request.user,
            month__gte=six_months_ago,
            month__lte=current_month
        ).order_by('month')

        MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

        history = []
        for snapshot in snapshots:
            month_label = f"{MONTHS_ES[snapshot.month.month - 1]} {str(snapshot.month.year)[2:]}"
            history.append({
                'month': month_label,
                'month_date': snapshot.month.isoformat(),
                'overall_score': snapshot.overall_score,
                'overall_status': snapshot.overall_status,
                'savings_rate_score': snapshot.savings_rate_score,
                'fixed_expenses_score': snapshot.fixed_expenses_score,
                'expense_diversification_score': snapshot.expense_diversification_score,
                'trend_score': snapshot.trend_score,
            })

        return Response({
            'history': history,
            'count': len(history)
        })
