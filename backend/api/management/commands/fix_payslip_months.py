from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import Payslip, Transaction, User
from datetime import date
from collections import defaultdict

MONTHS_ORDER = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

MONTHS_DISPLAY = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]


class Command(BaseCommand):
    help = 'Fix payslip months: shift from period month to payment month (+1 month)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def get_month_index(self, month_str):
        month_lower = month_str.lower()
        if month_lower in MONTHS_ORDER:
            return MONTHS_ORDER.index(month_lower)
        return -1

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made\n'))

        payslips_by_user = defaultdict(list)
        for p in Payslip.objects.all():
            payslips_by_user[p.user_id].append(p)

        if not payslips_by_user:
            self.stdout.write(self.style.WARNING('No payslips found'))
            return

        total_users = len(payslips_by_user)
        total_payslips = sum(len(v) for v in payslips_by_user.values())
        self.stdout.write(f'Found {total_payslips} payslips for {total_users} users\n')

        updated_count = 0
        error_count = 0

        for user_id, payslips in payslips_by_user.items():
            user = User.objects.get(id=user_id)
            self.stdout.write(f'Processing user: {user.username}')

            payslips_sorted = sorted(
                payslips,
                key=lambda p: (p.year, self.get_month_index(p.month)),
                reverse=True
            )

            changes = []
            for payslip in payslips_sorted:
                old_month = payslip.month
                old_year = payslip.year
                month_idx = self.get_month_index(old_month)

                if month_idx == -1:
                    self.stdout.write(self.style.ERROR(
                        f'  ERROR: Unknown month "{old_month}" in payslip {payslip.id}'
                    ))
                    error_count += 1
                    continue

                if month_idx == 11:
                    new_month_idx = 0
                    new_year = old_year + 1
                else:
                    new_month_idx = month_idx + 1
                    new_year = old_year

                new_month = MONTHS_DISPLAY[new_month_idx]

                changes.append({
                    'payslip': payslip,
                    'old_month': old_month,
                    'old_year': old_year,
                    'new_month': new_month,
                    'new_year': new_year,
                    'new_month_idx': new_month_idx,
                })

                self.stdout.write(
                    f'  Payslip {payslip.id}: {old_month} {old_year} -> {new_month} {new_year}'
                )

            if not dry_run and changes:
                try:
                    with transaction.atomic():
                        for change in changes:
                            p = change['payslip']
                            p.month = change['new_month']
                            p.year = change['new_year']
                            p.save()

                            related_tx = Transaction.objects.filter(payslip=p).first()
                            if related_tx:
                                new_date = date(change['new_year'], change['new_month_idx'] + 1, 1)
                                related_tx.date = new_date
                                related_tx.save()
                                self.stdout.write(f'    -> Transaction updated to {new_date}')

                    updated_count += len(changes)
                    self.stdout.write(self.style.SUCCESS(f'  {len(changes)} payslips updated'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  ERROR: {str(e)}'))
                    error_count += len(changes)
            elif dry_run:
                updated_count += len(changes)

            self.stdout.write('')

        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.SUCCESS(
                f'DRY RUN complete: {updated_count} payslips would be updated, {error_count} errors'
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'Done: {updated_count} payslips updated, {error_count} errors'
            ))
