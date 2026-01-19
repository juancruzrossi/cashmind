from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_health_score_snapshot'),
    ]

    operations = [
        migrations.RenameField(
            model_name='healthscoresnapshot',
            old_name='budget_adherence_score',
            new_name='expense_diversification_score',
        ),
    ]
