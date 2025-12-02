from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_remove_payslip_file_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='InvitationCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=50, unique=True)),
                ('is_used', models.BooleanField(default=False)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.CharField(blank=True, help_text="Ej: 'Para Juan', 'Prueba beta'", max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('used_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='invitation_used', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'invitation_codes',
                'ordering': ['-created_at'],
            },
        ),
    ]
