from django.db import models
from django.contrib.auth.models import AbstractUser


class InvitationCode(models.Model):
    """Invitation codes for controlled user registration"""
    code = models.CharField(max_length=50, unique=True)
    is_used = models.BooleanField(default=False)
    used_by = models.ForeignKey(
        'User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invitation_used'
    )
    used_at = models.DateTimeField(null=True, blank=True)
    notes = models.CharField(max_length=255, blank=True, help_text="Ej: 'Para Juan', 'Prueba beta'")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'invitation_codes'
        ordering = ['-created_at']

    def __str__(self):
        if self.is_used and self.used_by:
            status = f"Usado por {self.used_by.username}"
        elif self.is_used:
            status = "Usado (usuario eliminado)"
        else:
            status = "Disponible"
        return f"{self.code} - {status}"


class User(AbstractUser):
    """Custom User model for CashMind"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return self.username


class Payslip(models.Model):
    """Payslip/Recibo de sueldo model"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payslips')
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    upload_date = models.DateTimeField(auto_now_add=True)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2)
    employer = models.CharField(max_length=255, blank=True, null=True)
    position = models.CharField(max_length=255, blank=True, null=True)
    raw_text = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'payslips'
        ordering = ['-year', '-month', '-upload_date']

    def __str__(self):
        return f"{self.user.username} - {self.month} {self.year}"


class Deduction(models.Model):
    """Deduction model related to Payslip"""
    CATEGORY_CHOICES = [
        ('tax', 'Impuestos'),
        ('social_security', 'Seguridad Social'),
        ('retirement', 'Jubilación'),
        ('health', 'Salud'),
        ('other', 'Otros'),
    ]

    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='deductions')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='other')

    class Meta:
        db_table = 'deductions'

    def __str__(self):
        return f"{self.name} - ${self.amount}"


class Bonus(models.Model):
    """Bonus model related to Payslip"""
    TYPE_CHOICES = [
        ('regular', 'Regular'),
        ('performance', 'Desempeño'),
        ('holiday', 'Aguinaldo/Vacaciones'),
        ('other', 'Otros'),
    ]

    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='bonuses')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')

    class Meta:
        db_table = 'bonuses'

    def __str__(self):
        return f"{self.name} - ${self.amount}"


class Transaction(models.Model):
    """Transaction model for income/expenses"""
    TYPE_CHOICES = [
        ('income', 'Ingreso'),
        ('expense', 'Gasto'),
    ]
    FREQUENCY_CHOICES = [
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('yearly', 'Anual'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    date = models.DateField()
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    category = models.CharField(max_length=50)
    subcategory = models.CharField(max_length=50, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES, blank=True, null=True)
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, null=True, blank=True, related_name='transactions')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.description} - ${self.amount} ({self.type})"


class Budget(models.Model):
    """Budget model for expense tracking"""
    PERIOD_CHOICES = [
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
        ('yearly', 'Anual'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50)
    limit = models.DecimalField(max_digits=12, decimal_places=2)
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='monthly')
    color = models.CharField(max_length=7, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'budgets'
        unique_together = ['user', 'category', 'period']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - ${self.limit} ({self.period})"


class Goal(models.Model):
    """Goal model for savings targets"""
    CATEGORY_CHOICES = [
        ('savings', 'Ahorro'),
        ('investment', 'Inversión'),
        ('debt', 'Deuda'),
        ('purchase', 'Compra'),
        ('emergency', 'Emergencia'),
        ('other', 'Otros'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    target_amount = models.DecimalField(max_digits=12, decimal_places=2)
    current_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deadline = models.DateField(blank=True, null=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='savings')
    icon = models.CharField(max_length=50, blank=True, null=True)
    color = models.CharField(max_length=7, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'goals'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} - ${self.current_amount}/${self.target_amount}"


class HealthScoreSnapshot(models.Model):
    """Monthly snapshot of user's financial health score"""
    STATUS_CHOICES = [
        ('red', 'Necesita Atención'),
        ('yellow', 'Regular'),
        ('green', 'Excelente'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='health_score_snapshots')
    month = models.DateField(help_text="First day of the evaluated month")

    # Individual scores (0-100)
    savings_rate_score = models.IntegerField()
    fixed_expenses_score = models.IntegerField()
    budget_adherence_score = models.IntegerField()
    trend_score = models.IntegerField()

    # Overall score (0-100)
    overall_score = models.IntegerField()
    overall_status = models.CharField(max_length=10, choices=STATUS_CHOICES)

    # Cached Gemini advice
    cached_advice = models.TextField(null=True, blank=True)
    advice_generated_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'health_score_snapshots'
        unique_together = ['user', 'month']
        ordering = ['-month']

    def __str__(self):
        return f"{self.user.username} - {self.month.strftime('%Y-%m')} - {self.overall_status}"
