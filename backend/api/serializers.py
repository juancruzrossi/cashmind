from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Payslip, Deduction, Bonus, Transaction, Budget, Goal

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class DeductionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deduction
        fields = ['id', 'name', 'amount', 'percentage', 'category']


class BonusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bonus
        fields = ['id', 'name', 'amount', 'type']


class PayslipSerializer(serializers.ModelSerializer):
    deductions = DeductionSerializer(many=True, read_only=True)
    bonuses = BonusSerializer(many=True, read_only=True)

    class Meta:
        model = Payslip
        fields = [
            'id', 'month', 'year', 'upload_date',
            'gross_salary', 'net_salary', 'employer', 'position',
            'deductions', 'bonuses'
        ]
        read_only_fields = ['id', 'upload_date']


class PayslipCreateSerializer(serializers.ModelSerializer):
    deductions = DeductionSerializer(many=True, required=False)
    bonuses = BonusSerializer(many=True, required=False)

    class Meta:
        model = Payslip
        fields = [
            'month', 'year', 'gross_salary', 'net_salary',
            'employer', 'position', 'raw_text', 'deductions', 'bonuses'
        ]

    def create(self, validated_data):
        deductions_data = validated_data.pop('deductions', [])
        bonuses_data = validated_data.pop('bonuses', [])

        payslip = Payslip.objects.create(**validated_data)

        for deduction_data in deductions_data:
            Deduction.objects.create(payslip=payslip, **deduction_data)

        for bonus_data in bonuses_data:
            Bonus.objects.create(payslip=payslip, **bonus_data)

        return payslip


class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'date', 'description', 'amount', 'type', 'category',
            'subcategory', 'notes', 'is_recurring', 'recurring_frequency',
            'payslip', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'payslip']


class BudgetSerializer(serializers.ModelSerializer):
    spent = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = ['id', 'name', 'category', 'limit', 'spent', 'period', 'color', 'created_at']
        read_only_fields = ['id', 'created_at', 'spent']

    def get_spent(self, obj):
        from django.db.models import Sum
        from django.utils import timezone
        from datetime import timedelta

        now = timezone.now()

        if obj.period == 'weekly':
            start_date = now - timedelta(days=now.weekday())
        elif obj.period == 'monthly':
            start_date = now.replace(day=1)
        else:  # yearly
            start_date = now.replace(month=1, day=1)

        total = Transaction.objects.filter(
            user=obj.user,
            type='expense',
            category=obj.category,
            date__gte=start_date.date()
        ).aggregate(total=Sum('amount'))['total']

        return float(total or 0)


class GoalSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = [
            'id', 'name', 'description', 'target_amount', 'current_amount',
            'progress', 'deadline', 'category', 'icon', 'color', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'progress']

    def get_progress(self, obj):
        if obj.target_amount == 0:
            return 0
        return round((obj.current_amount / obj.target_amount) * 100, 2)


class GoalContributeSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
