from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Payslip, Deduction, Bonus, Transaction, Budget, Goal


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
