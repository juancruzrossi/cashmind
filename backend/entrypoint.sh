#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

# Create superuser if DJANGO_SUPERUSER_* env vars are set
if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput || echo "Superuser already exists"
fi

echo "Starting gunicorn..."
exec gunicorn cashmind.wsgi:application --bind 0.0.0.0:8000 --workers 2 --timeout 120 --log-level info
