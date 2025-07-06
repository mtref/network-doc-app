#!/bin/sh
# start.sh (at the root of your network-doc-app directory)
# This script is now solely responsible for starting the Flask backend.

# Wait for a moment to ensure file system is ready (optional, but can help)
sleep 1

# Set PYTHONPATH to include the root directory of your application,
# which contains the 'backend' package.
export PYTHONPATH=/app:$PYTHONPATH

# IMPORTANT: DO NOT change directory to /app/backend here.
# Flask and Gunicorn will be run from /app, referencing 'backend/app.py'.

# We no longer need to export FLASK_MIGRATE_DIR as a separate env var.
# export FLASK_MIGRATE_DIR=/app/backend/migrations

# Run Flask database migrations
echo "Running Flask database migrations..."
# Specify the Flask application using its direct file path relative to PYTHONPATH.
# Use the -d option to explicitly point to the migrations directory.
python3 -m flask --app backend/app.py db upgrade -d /app/backend/migrations

# Start Flask backend using Gunicorn (a production-ready WSGI server) in the background
echo "Starting Flask backend (Gunicorn)..."
# Reference the application using its full package path: 'backend.app:app'.
gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app
# Gunicorn should run in the foreground (no '&') if it's the main process.
