#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if DJANGO_SUPERUSER_* env vars are set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || echo "Superuser already exists"
fi

# Import data if IMPORT_DATA env var is set and data_export.json exists
if [ "$IMPORT_DATA" = "true" ] && [ -f "data_export.json" ]; then
    echo "Importing data from data_export.json..."
    python manage.py loaddata data_export.json || echo "Data import failed or already imported"
fi

echo "Starting gunicorn..."
exec gunicorn cashmind.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --log-level debug
