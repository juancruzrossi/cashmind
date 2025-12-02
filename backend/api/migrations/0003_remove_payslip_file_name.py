from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_alter_transaction_payslip_cascade'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='payslip',
            name='file_name',
        ),
    ]
