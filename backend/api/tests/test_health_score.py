from datetime import date
from decimal import Decimal

from django.test import TestCase

from api.models import User, Transaction, Budget
from api.services.health_score import HealthScoreService


class HealthScoreServiceTest(TestCase):
    """Tests for HealthScoreService"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.service = HealthScoreService()
        self.test_month = date(2026, 1, 1)

    def _create_income(self, amount: Decimal, day: int = 1):
        """Helper to create income transaction"""
        return Transaction.objects.create(
            user=self.user,
            date=date(2026, 1, day),
            description='Salary',
            amount=amount,
            type='income',
            category='salario'
        )

    def _create_expense(self, amount: Decimal, category: str, day: int = 15):
        """Helper to create expense transaction"""
        return Transaction.objects.create(
            user=self.user,
            date=date(2026, 1, day),
            description=f'{category} expense',
            amount=amount,
            type='expense',
            category=category
        )

    def _create_budget(self, category: str, limit: Decimal):
        """Helper to create budget"""
        return Budget.objects.create(
            user=self.user,
            name=f'{category} budget',
            category=category,
            limit=limit,
            period='monthly'
        )


class TestGetStatus(HealthScoreServiceTest):
    """Test get_status method"""

    def test_green_status_for_high_score(self):
        self.assertEqual(self.service.get_status(70), 'green')
        self.assertEqual(self.service.get_status(100), 'green')
        self.assertEqual(self.service.get_status(85), 'green')

    def test_yellow_status_for_medium_score(self):
        self.assertEqual(self.service.get_status(40), 'yellow')
        self.assertEqual(self.service.get_status(69), 'yellow')
        self.assertEqual(self.service.get_status(55), 'yellow')

    def test_red_status_for_low_score(self):
        self.assertEqual(self.service.get_status(0), 'red')
        self.assertEqual(self.service.get_status(39), 'red')
        self.assertEqual(self.service.get_status(10), 'red')


class TestCalculateSavingsRate(HealthScoreServiceTest):
    """Test calculate_savings_rate method"""

    def test_no_income_returns_red(self):
        result = self.service.calculate_savings_rate(self.user, self.test_month)
        self.assertEqual(result.score, 0)
        self.assertEqual(result.status, 'red')

    def test_high_savings_rate_is_green(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('700'), 'comida')

        result = self.service.calculate_savings_rate(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('30'))
        self.assertEqual(result.score, 100)
        self.assertEqual(result.status, 'green')

    def test_medium_savings_rate_is_yellow(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('850'), 'comida')

        result = self.service.calculate_savings_rate(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('15'))
        self.assertEqual(result.status, 'yellow')

    def test_low_savings_rate_is_red(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('950'), 'comida')

        result = self.service.calculate_savings_rate(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('5'))
        self.assertEqual(result.status, 'red')

    def test_negative_savings_rate_is_red(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('1200'), 'comida')

        result = self.service.calculate_savings_rate(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('-20'))
        self.assertEqual(result.status, 'red')
        self.assertEqual(result.score, 0)


class TestCalculateFixedExpensesRatio(HealthScoreServiceTest):
    """Test calculate_fixed_expenses_ratio method"""

    def test_no_income_returns_red(self):
        result = self.service.calculate_fixed_expenses_ratio(self.user, self.test_month)
        self.assertEqual(result.score, 0)
        self.assertEqual(result.status, 'red')

    def test_low_fixed_ratio_is_green(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('300'), 'vivienda')
        self._create_expense(Decimal('50'), 'servicios')

        result = self.service.calculate_fixed_expenses_ratio(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('35'))
        self.assertEqual(result.score, 100)
        self.assertEqual(result.status, 'green')

    def test_medium_fixed_ratio_is_yellow(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('500'), 'vivienda')

        result = self.service.calculate_fixed_expenses_ratio(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('50'))
        self.assertEqual(result.status, 'yellow')

    def test_high_fixed_ratio_is_red(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('600'), 'vivienda')

        result = self.service.calculate_fixed_expenses_ratio(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('60'))
        self.assertEqual(result.status, 'red')

    def test_only_counts_fixed_categories(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('200'), 'vivienda')
        self._create_expense(Decimal('500'), 'entretenimiento')

        result = self.service.calculate_fixed_expenses_ratio(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('20'))
        self.assertEqual(result.status, 'green')


class TestCalculateBudgetAdherence(HealthScoreServiceTest):
    """Test calculate_budget_adherence method"""

    def test_no_budgets_returns_red(self):
        result = self.service.calculate_budget_adherence(self.user, self.test_month)
        self.assertEqual(result.score, 0)
        self.assertEqual(result.status, 'red')

    def test_all_budgets_met_is_green(self):
        self._create_budget('comida', Decimal('500'))
        self._create_budget('transporte', Decimal('200'))
        self._create_expense(Decimal('400'), 'comida')
        self._create_expense(Decimal('150'), 'transporte')

        result = self.service.calculate_budget_adherence(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('100'))
        self.assertEqual(result.score, 100)
        self.assertEqual(result.status, 'green')

    def test_some_budgets_exceeded_is_yellow(self):
        self._create_budget('comida', Decimal('500'))
        self._create_budget('transporte', Decimal('200'))
        self._create_budget('entretenimiento', Decimal('100'))
        self._create_expense(Decimal('400'), 'comida')
        self._create_expense(Decimal('250'), 'transporte')
        self._create_expense(Decimal('50'), 'entretenimiento')

        result = self.service.calculate_budget_adherence(self.user, self.test_month)
        adherence = (Decimal('2') / Decimal('3')) * 100
        self.assertAlmostEqual(float(result.value), float(adherence), places=0)
        self.assertEqual(result.status, 'yellow')

    def test_most_budgets_exceeded_is_red(self):
        self._create_budget('comida', Decimal('100'))
        self._create_budget('transporte', Decimal('100'))
        self._create_expense(Decimal('200'), 'comida')
        self._create_expense(Decimal('200'), 'transporte')

        result = self.service.calculate_budget_adherence(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('0'))
        self.assertEqual(result.status, 'red')


class TestCalculateTrend(HealthScoreServiceTest):
    """Test calculate_trend method"""

    def test_no_previous_expenses_and_no_current_is_green(self):
        result = self.service.calculate_trend(self.user, self.test_month)
        self.assertEqual(result.score, 75)
        self.assertEqual(result.status, 'green')

    def test_no_previous_but_current_expenses_is_red(self):
        self._create_expense(Decimal('500'), 'comida')

        result = self.service.calculate_trend(self.user, self.test_month)
        self.assertEqual(result.status, 'red')

    def test_improved_spending_is_green(self):
        Transaction.objects.create(
            user=self.user,
            date=date(2025, 12, 15),
            description='Previous expense',
            amount=Decimal('1000'),
            type='expense',
            category='comida'
        )
        self._create_expense(Decimal('800'), 'comida')

        result = self.service.calculate_trend(self.user, self.test_month)
        self.assertEqual(result.value, Decimal('20'))
        self.assertEqual(result.score, 100)
        self.assertEqual(result.status, 'green')

    def test_stable_spending_is_green(self):
        Transaction.objects.create(
            user=self.user,
            date=date(2025, 12, 15),
            description='Previous expense',
            amount=Decimal('1000'),
            type='expense',
            category='comida'
        )
        self._create_expense(Decimal('1020'), 'comida')

        result = self.service.calculate_trend(self.user, self.test_month)
        self.assertEqual(result.status, 'green')

    def test_moderate_worsening_is_yellow(self):
        Transaction.objects.create(
            user=self.user,
            date=date(2025, 12, 15),
            description='Previous expense',
            amount=Decimal('1000'),
            type='expense',
            category='comida'
        )
        self._create_expense(Decimal('1080'), 'comida')

        result = self.service.calculate_trend(self.user, self.test_month)
        self.assertEqual(result.status, 'yellow')

    def test_significant_worsening_is_red(self):
        Transaction.objects.create(
            user=self.user,
            date=date(2025, 12, 15),
            description='Previous expense',
            amount=Decimal('1000'),
            type='expense',
            category='comida'
        )
        self._create_expense(Decimal('1200'), 'comida')

        result = self.service.calculate_trend(self.user, self.test_month)
        self.assertEqual(result.status, 'red')


class TestCalculateOverallScore(HealthScoreServiceTest):
    """Test calculate_overall_score method"""

    def test_weighted_calculation(self):
        from api.services.health_score import MetricResult

        savings = MetricResult(value=Decimal('25'), score=100, status='green')
        fixed = MetricResult(value=Decimal('35'), score=100, status='green')
        budget = MetricResult(value=Decimal('90'), score=100, status='green')
        trend = MetricResult(value=Decimal('10'), score=100, status='green')

        overall, status = self.service.calculate_overall_score(savings, fixed, budget, trend)
        self.assertEqual(overall, 100)
        self.assertEqual(status, 'green')

    def test_mixed_scores(self):
        from api.services.health_score import MetricResult

        savings = MetricResult(value=Decimal('15'), score=75, status='yellow')
        fixed = MetricResult(value=Decimal('50'), score=66, status='yellow')
        budget = MetricResult(value=Decimal('60'), score=66, status='yellow')
        trend = MetricResult(value=Decimal('-8'), score=60, status='yellow')

        overall, status = self.service.calculate_overall_score(savings, fixed, budget, trend)
        expected = (75 * 30 + 66 * 25 + 66 * 25 + 60 * 20) // 100
        self.assertEqual(overall, expected)
        self.assertEqual(status, 'yellow')


class TestCheckOnboardingNeeded(HealthScoreServiceTest):
    """Test check_onboarding_needed method"""

    def test_no_data_needs_onboarding(self):
        result = self.service.check_onboarding_needed(self.user, self.test_month)
        self.assertTrue(result)

    def test_missing_income_needs_onboarding(self):
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        result = self.service.check_onboarding_needed(self.user, self.test_month)
        self.assertTrue(result)

    def test_few_expenses_needs_onboarding(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('100'), 'comida')
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        result = self.service.check_onboarding_needed(self.user, self.test_month)
        self.assertTrue(result)

    def test_few_budgets_needs_onboarding(self):
        self._create_income(Decimal('1000'))
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        self._create_budget('comida', Decimal('500'))

        result = self.service.check_onboarding_needed(self.user, self.test_month)
        self.assertTrue(result)

    def test_sufficient_data_does_not_need_onboarding(self):
        self._create_income(Decimal('1000'))
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        result = self.service.check_onboarding_needed(self.user, self.test_month)
        self.assertFalse(result)


class TestCalculateHealthScore(HealthScoreServiceTest):
    """Test calculate_health_score integration method"""

    def test_complete_calculation(self):
        self._create_income(Decimal('1000'))
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        self._create_expense(Decimal('200'), 'vivienda')
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        Transaction.objects.create(
            user=self.user,
            date=date(2025, 12, 15),
            description='Previous expense',
            amount=Decimal('800'),
            type='expense',
            category='comida'
        )

        result = self.service.calculate_health_score(self.user, self.test_month)

        self.assertFalse(result.needs_onboarding)
        self.assertIn(result.overall_status, ['green', 'yellow', 'red'])
        self.assertGreaterEqual(result.overall_score, 0)
        self.assertLessEqual(result.overall_score, 100)
