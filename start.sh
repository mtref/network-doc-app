#!/bin/sh
# start.sh
# UPDATED: This script now fully automates the database migration process on every startup.
# You no longer need to run `flask db migrate` manually.

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the persistent path for the database and migrations inside the volume.
INSTANCE_PATH="/app/backend/instance"
MIGRATIONS_DIR="${INSTANCE_PATH}/migrations"

# Ensure the directory for the database exists.
mkdir -p "$INSTANCE_PATH"

# Set the FLASK_APP environment variable for all subsequent Flask commands.
export FLASK_APP=backend.app

# 1. Initialize the migrations directory if it doesn't exist.
# This only runs on the very first startup.
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found. Initializing database..."
  flask db init -d "$MIGRATIONS_DIR"
fi

# 2. Generate a new migration script if any models have changed.
# The `|| true` part prevents the script from exiting if there are no changes to migrate.
echo "Checking for model changes..."
flask db migrate -m "Auto-detect model changes" -d "$MIGRATIONS_DIR" || true

# 3. Apply any pending migrations to the database.
echo "Running database upgrade..."
flask db upgrade -d "$MIGRATIONS_DIR"

# 4. Seed the database with the default admin user if needed.
echo "Seeding database..."
flask seed

# 5. Start the Flask backend using Gunicorn.
echo "Starting Flask backend (Gunicorn)..."
exec gunicorn --workers 4 --bind 0.0.0.0:5000 "backend.app:create_app()"
