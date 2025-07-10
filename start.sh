#!/bin/sh
# start.sh (at the root of your network-doc-app directory)
# This script is responsible for starting the Flask backend and Nginx proxy.

# Exit immediately if a command exits with a non-zero status.
set -e

# Set the path to the migrations directory
MIGRATIONS_DIR="/app/backend/migrations"

# Check if the migrations directory exists. If not, this is the first run.
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found. Initializing database..."
  
  # 1. Initialize the migrations directory
  python3 -m flask --app backend.app db init -d "$MIGRATIONS_DIR"
  
  # 2. Create the initial migration script based on current models
  python3 -m flask --app backend.app db migrate -d "$MIGRATIONS_DIR" -m "Initial database schema."
fi

# Always run upgrade. This will apply the initial migration on the first run,
# and any new migrations on subsequent runs.
echo "Running database upgrade..."
python3 -m flask --app backend.app db upgrade -d "$MIGRATIONS_DIR"

# Seed the database with the default admin user
echo "Seeding database..."
python3 -m flask --app backend.app seed

# Start Nginx in the background
echo "Starting Nginx..."
nginx

# Start Flask backend using Gunicorn in the foreground
# This command will keep the container running as it is the main process.
echo "Starting Flask backend (Gunicorn)..."
exec gunicorn --workers 4 --bind 0.0.0.0:5000 "backend.app:create_app()"
