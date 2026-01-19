from datetime import date
from decimal import Decimal
from typing import NamedTuple

from dateutil.relativedelta import relativedelta
from django.db.models import Sum

from api.models import Transaction, Budget, User


class MetricResult(NamedTuple):
    """Result of a metric calculation with score and status"""
    value: Decimal
    score: int
    status: str


class OnboardingStatus(NamedTuple):
    """Status of onboarding requirements"""
    income_count: int
    expense_count: int
    budget_count: int
    income_required: int
    expense_required: int
    budget_required: int


class HealthScoreResult(NamedTuple):
    """Complete health score calculation result"""
    savings_rate: MetricResult
    fixed_expenses: MetricResult
    budget_adherence: MetricResult
    trend: MetricResult
    overall_score: int
    overall_status: str
    needs_onboarding: bool
    onboarding_status: OnboardingStatus | None


FIXED_EXPENSE_CATEGORIES = ['vivienda', 'servicios', 'transporte', 'seguros']


class HealthScoreService:
    """Service for calculating financial health score metrics"""

    @staticmethod
    def get_status(score: int) -> str:
        """Get status color based on score (0-100)"""
        if score >= 70:
            return 'green'
        elif score >= 40:
            return 'yellow'
        return 'red'

    @staticmethod
    def _get_month_range(month: date) -> tuple[date, date]:
        """Get start and end dates for a month"""
        start = month.replace(day=1)
        end = (start + relativedelta(months=1)) - relativedelta(days=1)
        return start, end

    def calculate_savings_rate(self, user: User, month: date) -> MetricResult:
        """
        Calculate savings rate: (income - expenses) / income * 100

        Thresholds:
        - Green: >= 20%
        - Yellow: 10-19%
        - Red: < 10% or no income
        """
        start, end = self._get_month_range(month)

        income = Transaction.objects.filter(
            user=user,
            type='income',
            date__gte=start,
            date__lte=end
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        expenses = Transaction.objects.filter(
            user=user,
            type='expense',
            date__gte=start,
            date__lte=end
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        if income == 0:
            return MetricResult(value=Decimal('0'), score=0, status='red')

        savings_rate = ((income - expenses) / income) * 100

        if savings_rate >= 20:
            score = 100
            status = 'green'
        elif savings_rate >= 10:
            score = int(50 + (savings_rate - 10) * 5)
            status = 'yellow'
        else:
            score = max(0, int(savings_rate * 5))
            status = 'red'

        return MetricResult(value=savings_rate, score=score, status=status)

    def calculate_fixed_expenses_ratio(self, user: User, month: date) -> MetricResult:
        """
        Calculate fixed expenses ratio: fixed_expenses / income * 100

        Fixed categories: vivienda, servicios, transporte, seguros

        Thresholds:
        - Green: <= 40%
        - Yellow: 41-55%
        - Red: > 55%
        """
        start, end = self._get_month_range(month)

        income = Transaction.objects.filter(
            user=user,
            type='income',
            date__gte=start,
            date__lte=end
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        if income == 0:
            return MetricResult(value=Decimal('0'), score=0, status='red')

        fixed_expenses = Transaction.objects.filter(
            user=user,
            type='expense',
            category__in=FIXED_EXPENSE_CATEGORIES,
            date__gte=start,
            date__lte=end
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        ratio = (fixed_expenses / income) * 100

        if ratio <= 40:
            score = 100
            status = 'green'
        elif ratio <= 55:
            score = int(100 - float(ratio - 40) * (50 / 15))
            status = 'yellow'
        else:
            score = max(0, int(50 - float(ratio - 55) * 2))
            status = 'red'

        return MetricResult(value=ratio, score=score, status=status)

    def calculate_budget_adherence(self, user: User, month: date) -> MetricResult:
        """
        Calculate budget adherence: categories_within_budget / total_budgeted_categories * 100

        Thresholds:
        - Green: >= 80%
        - Yellow: 50-79%
        - Red: < 50% or no budgets defined
        """
        start, end = self._get_month_range(month)

        budgets = Budget.objects.filter(user=user, period='monthly')

        if not budgets.exists():
            return MetricResult(value=Decimal('0'), score=0, status='red')

        categories_within_budget = 0
        total_budgets = 0

        for budget in budgets:
            total_budgets += 1
            spent = Transaction.objects.filter(
                user=user,
                type='expense',
                category=budget.category,
                date__gte=start,
                date__lte=end
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

            if spent <= budget.limit:
                categories_within_budget += 1

        if total_budgets == 0:
            return MetricResult(value=Decimal('0'), score=0, status='red')

        adherence = Decimal(categories_within_budget) / Decimal(total_budgets) * 100

        if adherence >= 80:
            score = 100
            status = 'green'
        elif adherence >= 50:
            score = int(50 + float(adherence - 50) * (50 / 30))
            status = 'yellow'
        else:
            score = int(adherence)
            status = 'red'

        return MetricResult(value=adherence, score=score, status=status)

    def calculate_trend(self, user: User, month: date) -> MetricResult:
        """
        Calculate monthly trend: (previous_expenses - current_expenses) / previous_expenses * 100

        Positive = improvement (spending less)

        Thresholds:
        - Green: improvement >= 5% or stable (0-5% change either way)
        - Yellow: worsening 0-10%
        - Red: worsening > 10%
        """
        start_current, end_current = self._get_month_range(month)
        previous_month = month - relativedelta(months=1)
        start_prev, end_prev = self._get_month_range(previous_month)

        current_expenses = Transaction.objects.filter(
            user=user,
            type='expense',
            date__gte=start_current,
            date__lte=end_current
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        previous_expenses = Transaction.objects.filter(
            user=user,
            type='expense',
            date__gte=start_prev,
            date__lte=end_prev
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        if previous_expenses == 0:
            if current_expenses == 0:
                return MetricResult(value=Decimal('0'), score=75, status='green')
            return MetricResult(value=Decimal('-100'), score=0, status='red')

        improvement = ((previous_expenses - current_expenses) / previous_expenses) * 100

        if improvement >= 5:
            score = 100
            status = 'green'
        elif improvement >= -5:
            score = 75
            status = 'green'
        elif improvement >= -10:
            score = int(50 + (improvement + 10) * 5)
            status = 'yellow'
        else:
            score = max(0, int(50 + improvement * 2))
            status = 'red'

        return MetricResult(value=improvement, score=score, status=status)

    def calculate_overall_score(
        self,
        savings: MetricResult,
        fixed: MetricResult,
        budget: MetricResult,
        trend: MetricResult
    ) -> tuple[int, str]:
        """
        Calculate weighted overall score.

        Weights:
        - Savings rate: 30%
        - Fixed expenses: 25%
        - Budget adherence: 25%
        - Trend: 20%
        """
        weighted_score = (
            savings.score * 30 +
            fixed.score * 25 +
            budget.score * 25 +
            trend.score * 20
        ) // 100

        return weighted_score, self.get_status(weighted_score)

    def get_onboarding_status(self, user: User, month: date) -> tuple[bool, OnboardingStatus]:
        """
        Check if user needs onboarding and return status.

        Requirements:
        - At least 1 income
        - At least 5 expense transactions
        - At least 3 budgets defined
        """
        start, end = self._get_month_range(month)

        income_count = Transaction.objects.filter(
            user=user,
            type='income',
            date__gte=start,
            date__lte=end
        ).count()

        expense_count = Transaction.objects.filter(
            user=user,
            type='expense',
            date__gte=start,
            date__lte=end
        ).count()

        budget_count = Budget.objects.filter(user=user, period='monthly').count()

        income_required = 1
        expense_required = 5
        budget_required = 3

        needs_onboarding = (
            income_count < income_required or
            expense_count < expense_required or
            budget_count < budget_required
        )

        onboarding_status = OnboardingStatus(
            income_count=income_count,
            expense_count=expense_count,
            budget_count=budget_count,
            income_required=income_required,
            expense_required=expense_required,
            budget_required=budget_required,
        )

        return needs_onboarding, onboarding_status

    def calculate_health_score(self, user: User, month: date) -> HealthScoreResult:
        """Calculate complete financial health score for a user and month"""
        needs_onboarding, onboarding_status = self.get_onboarding_status(user, month)

        savings = self.calculate_savings_rate(user, month)
        fixed = self.calculate_fixed_expenses_ratio(user, month)
        budget = self.calculate_budget_adherence(user, month)
        trend = self.calculate_trend(user, month)

        overall_score, overall_status = self.calculate_overall_score(
            savings, fixed, budget, trend
        )

        return HealthScoreResult(
            savings_rate=savings,
            fixed_expenses=fixed,
            budget_adherence=budget,
            trend=trend,
            overall_score=overall_score,
            overall_status=overall_status,
            needs_onboarding=needs_onboarding,
            onboarding_status=onboarding_status if needs_onboarding else None
        )
