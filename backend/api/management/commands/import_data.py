from django.core.management.base import BaseCommand
from django.core.management import call_command
from api.models import User
import os


class Command(BaseCommand):
    help = 'Import data from data_export.json, handling user conflicts'

    def handle(self, *args, **options):
        export_file = 'data_export.json'

        if not os.path.exists(export_file):
            self.stdout.write(self.style.WARNING(f'{export_file} not found, skipping import'))
            return

        # Delete existing users to avoid pk conflicts
        existing_users = User.objects.all()
        if existing_users.exists():
            self.stdout.write(f'Deleting {existing_users.count()} existing user(s)...')
            existing_users.delete()

        # Load the data
        self.stdout.write('Loading data from export...')
        try:
            call_command('loaddata', export_file, verbosity=2)
            self.stdout.write(self.style.SUCCESS('Data imported successfully!'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Import failed: {e}'))
