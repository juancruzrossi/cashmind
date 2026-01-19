from datetime import date
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from api.models import User, Transaction, Budget, HealthScoreSnapshot
from api.services.health_score import HealthScoreService, MetricResult


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
        savings = MetricResult(value=Decimal('25'), score=100, status='green')
        fixed = MetricResult(value=Decimal('35'), score=100, status='green')
        budget = MetricResult(value=Decimal('90'), score=100, status='green')
        trend = MetricResult(value=Decimal('10'), score=100, status='green')

        overall, status = self.service.calculate_overall_score(savings, fixed, budget, trend)
        self.assertEqual(overall, 100)
        self.assertEqual(status, 'green')

    def test_mixed_scores(self):
        savings = MetricResult(value=Decimal('15'), score=75, status='yellow')
        fixed = MetricResult(value=Decimal('50'), score=66, status='yellow')
        budget = MetricResult(value=Decimal('60'), score=66, status='yellow')
        trend = MetricResult(value=Decimal('-8'), score=60, status='yellow')

        overall, status = self.service.calculate_overall_score(savings, fixed, budget, trend)
        expected = (75 * 30 + 66 * 25 + 66 * 25 + 60 * 20) // 100
        self.assertEqual(overall, expected)
        self.assertEqual(status, 'yellow')


class TestGetOnboardingStatus(HealthScoreServiceTest):
    """Test get_onboarding_status method"""

    def test_no_data_needs_onboarding(self):
        needs_onboarding, onboarding_status = self.service.get_onboarding_status(
            self.user, self.test_month
        )
        self.assertTrue(needs_onboarding)
        self.assertEqual(onboarding_status.income_count, 0)
        self.assertEqual(onboarding_status.expense_count, 0)
        self.assertEqual(onboarding_status.budget_count, 0)

    def test_missing_income_needs_onboarding(self):
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        needs_onboarding, onboarding_status = self.service.get_onboarding_status(
            self.user, self.test_month
        )
        self.assertTrue(needs_onboarding)
        self.assertEqual(onboarding_status.income_count, 0)
        self.assertEqual(onboarding_status.expense_count, 5)
        self.assertEqual(onboarding_status.budget_count, 3)

    def test_few_expenses_needs_onboarding(self):
        self._create_income(Decimal('1000'))
        self._create_expense(Decimal('100'), 'comida')
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        needs_onboarding, onboarding_status = self.service.get_onboarding_status(
            self.user, self.test_month
        )
        self.assertTrue(needs_onboarding)
        self.assertEqual(onboarding_status.income_count, 1)
        self.assertEqual(onboarding_status.expense_count, 1)

    def test_few_budgets_needs_onboarding(self):
        self._create_income(Decimal('1000'))
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        self._create_budget('comida', Decimal('500'))

        needs_onboarding, onboarding_status = self.service.get_onboarding_status(
            self.user, self.test_month
        )
        self.assertTrue(needs_onboarding)
        self.assertEqual(onboarding_status.budget_count, 1)

    def test_sufficient_data_does_not_need_onboarding(self):
        self._create_income(Decimal('1000'))
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        needs_onboarding, onboarding_status = self.service.get_onboarding_status(
            self.user, self.test_month
        )
        self.assertFalse(needs_onboarding)
        self.assertEqual(onboarding_status.income_count, 1)
        self.assertEqual(onboarding_status.expense_count, 5)
        self.assertEqual(onboarding_status.budget_count, 3)


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

    def test_no_income_automatic_red(self):
        """Test that no income results in automatic red status"""
        result = self.service.calculate_health_score(self.user, self.test_month)
        self.assertEqual(result.savings_rate.status, 'red')
        self.assertEqual(result.fixed_expenses.status, 'red')


# ==============================================================================
# API Endpoint Tests
# ==============================================================================

class HealthScoreEndpointTest(APITestCase):
    """Tests for /api/health-score/ endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('health-score')

    def _create_income(self, amount: Decimal, day: int = 1):
        return Transaction.objects.create(
            user=self.user,
            date=date(2026, 1, day),
            description='Salary',
            amount=amount,
            type='income',
            category='salario'
        )

    def _create_expense(self, amount: Decimal, category: str, day: int = 15):
        return Transaction.objects.create(
            user=self.user,
            date=date(2026, 1, day),
            description=f'{category} expense',
            amount=amount,
            type='expense',
            category=category
        )

    def _create_budget(self, category: str, limit: Decimal):
        return Budget.objects.create(
            user=self.user,
            name=f'{category} budget',
            category=category,
            limit=limit,
            period='monthly'
        )

    def test_unauthenticated_request_fails(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_health_score_without_data(self):
        """Test endpoint returns data even without transactions"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('overall_score', response.data)
        self.assertIn('overall_status', response.data)
        self.assertIn('needs_onboarding', response.data)
        self.assertTrue(response.data['needs_onboarding'])

    def test_get_health_score_with_data(self):
        """Test endpoint returns correct data with transactions"""
        self._create_income(Decimal('1000'))
        for i in range(5):
            self._create_expense(Decimal('100'), 'comida', day=i+1)
        for cat in ['comida', 'transporte', 'entretenimiento']:
            self._create_budget(cat, Decimal('500'))

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['needs_onboarding'])

        self.assertIn('savings_rate', response.data)
        self.assertIn('fixed_expenses', response.data)
        self.assertIn('budget_adherence', response.data)
        self.assertIn('trend', response.data)

        # Check metric structure
        for metric in ['savings_rate', 'fixed_expenses', 'budget_adherence', 'trend']:
            self.assertIn('value', response.data[metric])
            self.assertIn('score', response.data[metric])
            self.assertIn('status', response.data[metric])

    def test_creates_snapshot(self):
        """Test that endpoint creates a snapshot in the database"""
        self._create_income(Decimal('1000'))

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        snapshot = HealthScoreSnapshot.objects.filter(user=self.user).first()
        self.assertIsNotNone(snapshot)
        self.assertEqual(snapshot.overall_score, response.data['overall_score'])

    def test_updates_existing_snapshot(self):
        """Test that endpoint updates existing snapshot"""
        self._create_income(Decimal('1000'))
        self.client.get(self.url)

        # Add more income to change the score
        self._create_income(Decimal('500'), day=2)
        self.client.get(self.url)

        snapshots = HealthScoreSnapshot.objects.filter(user=self.user)
        self.assertEqual(snapshots.count(), 1)

    def test_returns_onboarding_status_when_needed(self):
        """Test that onboarding_status is returned when needs_onboarding is true"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['needs_onboarding'])
        self.assertIn('onboarding_status', response.data)
        self.assertIn('income_count', response.data['onboarding_status'])
        self.assertIn('expense_count', response.data['onboarding_status'])
        self.assertIn('budget_count', response.data['onboarding_status'])

    def test_no_income_returns_red_status(self):
        """Test AC-7: Month without income shows automatic red semaphore"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['savings_rate']['status'], 'red')
        self.assertEqual(response.data['fixed_expenses']['status'], 'red')


class HealthScoreAdviceEndpointTest(APITestCase):
    """Tests for /api/health-score/advice/ endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('health-score-advice')
        self.score_url = reverse('health-score')

    def test_unauthenticated_request_fails(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_without_snapshot_returns_404(self):
        """Test that endpoint requires a snapshot to exist"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch('api.views.GeminiService')
    def test_get_generates_advice_when_not_cached(self, mock_gemini):
        """Test GET generates advice when no cached advice exists"""
        mock_instance = MagicMock()
        mock_instance.generate_financial_advice.return_value = "Test advice"
        mock_gemini.return_value = mock_instance

        # First create a snapshot by calling health-score
        self.client.get(self.score_url)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('advice', response.data)
        self.assertEqual(response.data['advice'], "Test advice")
        self.assertFalse(response.data['cached'])

    @patch('api.views.GeminiService')
    def test_get_returns_cached_advice(self, mock_gemini):
        """Test GET returns cached advice when it exists"""
        # Create snapshot with cached advice
        self.client.get(self.score_url)
        snapshot = HealthScoreSnapshot.objects.get(user=self.user)
        snapshot.cached_advice = "Cached advice"
        snapshot.advice_generated_at = date.today()
        snapshot.save()

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['advice'], "Cached advice")
        self.assertTrue(response.data['cached'])
        mock_gemini.assert_not_called()

    @patch('api.views.GeminiService')
    def test_post_regenerates_advice(self, mock_gemini):
        """Test POST always regenerates advice"""
        mock_instance = MagicMock()
        mock_instance.generate_financial_advice.return_value = "New advice"
        mock_gemini.return_value = mock_instance

        # Create snapshot with cached advice
        self.client.get(self.score_url)
        snapshot = HealthScoreSnapshot.objects.get(user=self.user)
        snapshot.cached_advice = "Old advice"
        snapshot.save()

        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['advice'], "New advice")
        self.assertFalse(response.data['cached'])

    @patch('api.views.GeminiService')
    def test_gemini_error_returns_500(self, mock_gemini):
        """Test that Gemini errors return 500"""
        mock_instance = MagicMock()
        mock_instance.generate_financial_advice.side_effect = Exception("API Error")
        mock_gemini.return_value = mock_instance

        self.client.get(self.score_url)

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)


class HealthScoreHistoryEndpointTest(APITestCase):
    """Tests for /api/health-score/history/ endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.url = reverse('health-score-history')

    def test_unauthenticated_request_fails(self):
        self.client.logout()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_empty_history(self):
        """Test endpoint returns empty history when no snapshots"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('history', response.data)
        self.assertEqual(len(response.data['history']), 0)
        self.assertEqual(response.data['count'], 0)

    def test_returns_history_sorted_by_month(self):
        """Test history is sorted by month ascending"""
        # Create snapshots for multiple months
        months = [
            date(2026, 1, 1),
            date(2025, 11, 1),
            date(2025, 12, 1),
        ]
        for i, month in enumerate(months):
            HealthScoreSnapshot.objects.create(
                user=self.user,
                month=month,
                savings_rate_score=70 + i,
                fixed_expenses_score=70 + i,
                budget_adherence_score=70 + i,
                trend_score=70 + i,
                overall_score=70 + i,
                overall_status='green'
            )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)

        # Should be sorted ascending
        history = response.data['history']
        self.assertEqual(history[0]['month_date'], '2025-11-01')
        self.assertEqual(history[1]['month_date'], '2025-12-01')
        self.assertEqual(history[2]['month_date'], '2026-01-01')

    def test_returns_only_last_6_months(self):
        """Test history only returns last 6 months of snapshots"""
        # Create snapshots for 8 months
        base_date = date(2026, 1, 1)
        from dateutil.relativedelta import relativedelta

        for i in range(8):
            month = base_date - relativedelta(months=i)
            HealthScoreSnapshot.objects.create(
                user=self.user,
                month=month.replace(day=1),
                savings_rate_score=70,
                fixed_expenses_score=70,
                budget_adherence_score=70,
                trend_score=70,
                overall_score=70,
                overall_status='green'
            )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertLessEqual(response.data['count'], 6)

    def test_history_contains_all_score_fields(self):
        """Test history entries contain all required fields"""
        HealthScoreSnapshot.objects.create(
            user=self.user,
            month=date(2026, 1, 1),
            savings_rate_score=80,
            fixed_expenses_score=75,
            budget_adherence_score=90,
            trend_score=85,
            overall_score=82,
            overall_status='green'
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        entry = response.data['history'][0]
        self.assertIn('month', entry)
        self.assertIn('month_date', entry)
        self.assertIn('overall_score', entry)
        self.assertIn('overall_status', entry)
        self.assertIn('savings_rate_score', entry)
        self.assertIn('fixed_expenses_score', entry)
        self.assertIn('budget_adherence_score', entry)
        self.assertIn('trend_score', entry)

    def test_does_not_return_other_users_data(self):
        """Test history only returns current user's snapshots"""
        other_user = User.objects.create_user(
            username='otheruser',
            password='testpass123'
        )

        HealthScoreSnapshot.objects.create(
            user=self.user,
            month=date(2026, 1, 1),
            savings_rate_score=80,
            fixed_expenses_score=75,
            budget_adherence_score=90,
            trend_score=85,
            overall_score=82,
            overall_status='green'
        )
        HealthScoreSnapshot.objects.create(
            user=other_user,
            month=date(2026, 1, 1),
            savings_rate_score=50,
            fixed_expenses_score=50,
            budget_adherence_score=50,
            trend_score=50,
            overall_score=50,
            overall_status='yellow'
        )

        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['history'][0]['overall_score'], 82)
