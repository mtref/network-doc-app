# backend/app.py
# This is the main Flask application for the network documentation backend.
# UPDATED: Now requires the FERNET_KEY to be set as an environment variable.

import os
from flask import Flask
from flask_cors import CORS
from datetime import timedelta
from cryptography.fernet import Fernet

# Import initialized extensions
from .extensions import db, migrate, bcrypt, jwt

# Import models to ensure they are registered with SQLAlchemy
from .models import User, Location, Rack, PC, PatchPanel, Switch, Connection, ConnectionHop, PdfTemplate, AppSettings, PasswordEntry

# Import the function to register routes
from .routes import register_routes

def create_admin_user_if_not_exists(app):
    """Create a default admin user if no users exist in the database."""
    with app.app_context():
        if not User.query.first():
            print("No users found. Creating default admin user...")
            hashed_password = bcrypt.generate_password_hash('admin').decode('utf-8')
            admin_user = User(username='admin', password_hash=hashed_password, role='Admin')
            db.session.add(admin_user)
            db.session.commit()
            print("Default admin user created.")

def create_app():
    """
    Factory function to create and configure the Flask application.
    """
    app = Flask(__name__, instance_path='/data')
    
    CORS(app, supports_credentials=True) 

    # --- Configuration ---
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a-hard-to-guess-string')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'another-super-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
    
    # CORRECTED: Require the FERNET_KEY from the environment.
    # This prevents a new key from being generated on every restart.
    fernet_key = os.environ.get('FERNET_KEY')
    if not fernet_key:
        raise ValueError("No FERNET_KEY set for Flask application. Please set it in your .env file.")
    app.config['FERNET_KEY'] = fernet_key

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_doc.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    UPLOAD_FOLDER_PATH = os.path.join(app.instance_path, 'uploads/pdf_templates')
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER_PATH
    app.config['ALLOWED_EXTENSIONS'] = {'pdf'}
    app.config['MAX_PDF_FILES'] = 5

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    register_routes(app)

    @app.cli.command("seed")
    def seed_db():
        """Seeds the database with initial data (e.g., admin user)."""
        create_admin_user_if_not_exists(app)

    return app

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
