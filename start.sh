#!/bin/sh
# start.sh (at the root of your network-doc-app directory)
# This script orchestrates the startup of both Flask and Nginx within the single container.

# Wait for a moment to ensure file system is ready (optional, but can help)
sleep 1

# Change directory to the backend application root for Flask-Migrate
# This ensures 'migrations' folder is found relative to the CWD
cd /app/backend

# Run Flask database migrations
echo "Running Flask database migrations..."
# Use python3 -m flask to ensure the correct Flask executable from pip is used
# 'db upgrade' needs to be run from the directory containing 'app.py' and 'migrations'
python3 -m flask db upgrade

# Start Flask backend using Gunicorn (a production-ready WSGI server) in the background
echo "Starting Flask backend (Gunicorn)..."
# Use python3 -m gunicorn to ensure the correct gunicorn executable from pip is used
# Gunicorn will also be run from the /app/backend directory due to the 'cd' command above
gunicorn -w 4 -b 0.0.0.0:5000 app:app & # Removed --chdir as we already changed dir

# Change back to the root application directory for Nginx if needed (optional)
cd /app

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g "daemon off;"

# The 'wait -n' command waits for any child process to exit.
# This ensures that the shell script (and thus the Docker container) exits
# if either Nginx or Gunicorn crashes, preventing a zombie container.
wait -n

# Exit with the status of the process that exited first
exit $?