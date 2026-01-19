from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Payslip, Deduction, Bonus, Transaction, Budget, Goal, InvitationCode, HealthScoreSnapshot


@admin.register(InvitationCode)
class InvitationCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'is_used', 'used_by', 'notes', 'created_at', 'used_at']
    list_filter = ['is_used', 'created_at']
    search_fields = ['code', 'notes', 'used_by__username']
    readonly_fields = ['used_by', 'used_at']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('code', 'notes')}),
        ('Estado', {'fields': ('is_used', 'used_by', 'used_at'), 'classes': ('collapse',)}),
    )

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.is_used:
            return ['code', 'is_used', 'used_by', 'used_at', 'notes']
        return ['used_by', 'used_at']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ['created_at', 'updated_at']


class DeductionInline(admin.TabularInline):
    model = Deduction
    extra = 0


class BonusInline(admin.TabularInline):
    model = Bonus
    extra = 0


@admin.register(Payslip)
class PayslipAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'year', 'gross_salary', 'net_salary', 'employer', 'upload_date']
    list_filter = ['year', 'month', 'employer']
    search_fields = ['user__username', 'employer', 'position']
    ordering = ['-year', '-upload_date']
    inlines = [DeductionInline, BonusInline]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'description', 'amount', 'type', 'category']
    list_filter = ['type', 'category', 'is_recurring', 'date']
    search_fields = ['user__username', 'description', 'notes']
    ordering = ['-date', '-created_at']
    date_hierarchy = 'date'


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'category', 'limit', 'period']
    list_filter = ['period', 'category']
    search_fields = ['user__username', 'name', 'category']


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'target_amount', 'current_amount', 'deadline', 'category']
    list_filter = ['category', 'deadline']
    search_fields = ['user__username', 'name', 'description']
    ordering = ['deadline', '-created_at']


@admin.register(HealthScoreSnapshot)
class HealthScoreSnapshotAdmin(admin.ModelAdmin):
    list_display = ['user', 'month', 'overall_score', 'overall_status', 'created_at']
    list_filter = ['overall_status', 'month']
    search_fields = ['user__username']
    ordering = ['-month', '-created_at']
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        (None, {'fields': ('user', 'month')}),
        ('Scores', {'fields': ('savings_rate_score', 'fixed_expenses_score', 'expense_diversification_score', 'trend_score')}),
        ('Overall', {'fields': ('overall_score', 'overall_status')}),
        ('Advice', {'fields': ('cached_advice', 'advice_generated_at'), 'classes': ('collapse',)}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )
