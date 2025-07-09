#!/bin/sh
# start.sh (at the root of your network-doc-app directory)
# This script is responsible for starting the Flask backend.

# Exit immediately if a command exits with a non-zero status.
set -e

# Set PYTHONPATH to include the root directory of your application,
# which contains the 'backend' package.
export PYTHONPATH=/app:$PYTHONPATH
MIGRATIONS_DIR="/app/backend/migrations"

# Attempt to upgrade the database. If it fails because the migrations
# directory doesn't exist, we'll initialize everything. This makes
# the first run seamless.
echo "Attempting database upgrade..."
if ! python3 -m flask --app backend.app db upgrade -d "$MIGRATIONS_DIR"; then
    echo "Database upgrade failed. This is likely the first run. Initializing database..."
    
    # 1. Initialize the migrations directory
    python3 -m flask --app backend.app db init -d "$MIGRATIONS_DIR"
    
    # 2. Create the initial migration script based on current models
    python3 -m flask --app backend.app db migrate -d "$MIGRATIONS_DIR" -m "Initial database schema."
    
    # 3. Now, run the upgrade again with the newly created scripts
    python3 -m flask --app backend.app db upgrade -d "$MIGRATIONS_DIR"
    
    echo "Database initialized and upgraded successfully."
fi


# Seed the database with the default admin user
echo "Seeding database..."
python3 -m flask --app backend.app seed

# Start Flask backend using Gunicorn in the foreground
# This command will keep the container running as it is the primary process.
echo "Starting Flask backend (Gunicorn)..."
exec gunicorn -w 4 -b 0.0.0.0:5000 "backend.app:create_app()"
