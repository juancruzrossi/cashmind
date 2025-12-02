from django.db import migrations
from datetime import date


def fix_payslip_months(apps, schema_editor):
    Payslip = apps.get_model('api', 'Payslip')
    Transaction = apps.get_model('api', 'Transaction')
    User = apps.get_model('api', 'User')

    MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
              'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    DISPLAY = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    try:
        user = User.objects.get(username='jxjx')
    except User.DoesNotExist:
        return

    payslips = list(Payslip.objects.filter(user=user))
    payslips.sort(key=lambda p: (p.year, MONTHS.index(p.month.lower()) if p.month.lower() in MONTHS else 0), reverse=True)

    for p in payslips:
        month_lower = p.month.lower()
        if month_lower not in MONTHS:
            continue

        idx = MONTHS.index(month_lower)
        if idx == 11:
            p.month = 'Enero'
            p.year = p.year + 1
        else:
            p.month = DISPLAY[idx + 1]
        p.save()

        # Fix transaction date to day 1 of the new month
        for t in Transaction.objects.filter(payslip=p):
            new_month_idx = MONTHS.index(p.month.lower()) + 1
            t.date = date(p.year, new_month_idx, 1)
            t.save()


def reverse_fix(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_invitationcode'),
    ]

    operations = [
        migrations.RunPython(fix_payslip_months, reverse_fix),
    ]
