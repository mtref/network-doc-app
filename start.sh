#!/bin/sh
# start.sh (at the root of your network-doc-app directory)
# This script is responsible for starting the Flask backend (Gunicorn)
# and the Nginx frontend proxy in a single Docker container.

# Wait for a moment to ensure file system is ready (optional, but can help)
sleep 1

# Set PYTHONPATH to include the root directory of your application,
# which contains the 'backend' package.
export PYTHONPATH=/app:$PYTHONPATH

# IMPORTANT: DO NOT change directory to /app/backend here.
# Flask and Gunicorn will be run from /app, referencing 'backend/app.py'.

# Run Flask database upgrade (applies all pending migrations)
echo "Running Flask database upgrade..."
python3 -m flask --app backend/app.py db upgrade -d /app/backend/migrations

# Start Nginx in the background
echo "Starting Nginx..."
nginx -g "daemon off;" & # Start Nginx in background, redirecting its output to /dev/null if desired

# Start Flask backend using Gunicorn in the foreground
# This command will keep the container running as it is the primary process.
echo "Starting Flask backend (Gunicorn) in foreground..."
exec gunicorn -w 4 -b 0.0.0.0:5000 backend.app:app