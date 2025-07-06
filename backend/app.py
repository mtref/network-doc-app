# backend/app.py
# This is the main Flask application for the network documentation backend.
# It initializes the app, database, and registers the API routes.

import os
from flask import Flask
from flask_cors import CORS # For handling Cross-Origin Resource Sharing

# Import initialized extensions
from .extensions import db, migrate

# Import models to ensure they are registered with SQLAlchemy
from .models import Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings

# Import the function to register routes
from .routes import register_routes

# --- Debugging Start ---
print("--- app.py: Starting Flask app initialization ---")
# --- Debugging End ---

def create_app():
    """
    Factory function to create and configure the Flask application.
    """
    app = Flask(__name__)
    CORS(app) # Enable CORS for all routes

    # --- Debugging Start ---
    print("--- app.py: CORS initialized ---")
    # --- Debugging End ---

    # Database configuration
    # Using SQLite for simplicity. The database file will be stored in the 'instance' folder.
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_doc.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Configuration for PDF uploads
    UPLOAD_FOLDER_PATH = os.path.join(app.root_path, 'uploads/pdf_templates')
    ALLOWED_EXTENSIONS_SET = {'pdf'}
    MAX_PDF_FILES_LIMIT = 5

    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER_PATH
    app.config['ALLOWED_EXTENSIONS'] = ALLOWED_EXTENSIONS_SET
    app.config['MAX_PDF_FILES'] = MAX_PDF_FILES_LIMIT

    # --- Debugging Start ---
    print(f"--- app.py: App config set. UPLOAD_FOLDER: {app.config['UPLOAD_FOLDER']}, MAX_PDF_FILES: {app.config['MAX_PDF_FILES']} ---")
    # --- Debugging End ---

    # Ensure the upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # --- Debugging Start ---
    print(f"--- app.py: Upload folder checked/created: {app.config['UPLOAD_FOLDER']} ---")
    # --- Debugging End ---

    # Initialize extensions with the app
    db.init_app(app)
    migrate.init_app(app, db)

    # --- Debugging Start ---
    print("--- app.py: SQLAlchemy and Migrate initialized ---")
    # --- Debugging End ---

    # Register routes
    register_routes(app)

    # --- Debugging Start ---
    print("--- app.py: Routes registered ---")
    # --- Debugging End ---

    return app

# Create the app instance
app = create_app()

if __name__ == '__main__':
    # The 'flask db upgrade' command in docker-compose handles initial migration
    # and database creation when running with gunicorn.
    # For local development without docker-compose, you might run:
    # with app.app_context():
    #     db.create_all()
    app.run(debug=True, host='0.0.0.0')
