# backend/config.py
# UPDATED: This file now loads all secret keys and configuration values
# from environment variables, making it the single source of truth for app config.

import os
from datetime import timedelta

# The base directory for the backend application.
basedir = os.path.abspath(os.path.dirname(__file__))
# The path for persistent data, which will be inside the Docker volume.
instance_path = os.path.join(basedir, 'instance')

class Config:
    """Base configuration class. Contains all app config variables."""

    # --- Secret Keys ---
    # These MUST be set in the .env file.
    # Default values are provided for convenience but should not be used in production.
    SECRET_KEY = os.environ.get('SECRET_KEY', 'a-very-secret-key-that-you-should-change')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'another-super-secret-key-for-jwt')
    
    # The FERNET_KEY is required for password encryption and has no default.
    # The app will fail to start if this is not in the .env file.
    FERNET_KEY = os.environ.get('FERNET_KEY')

    # --- JWT Settings ---
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # --- Database Settings ---
    # The database URI points to a file inside the 'instance' folder,
    # which is mounted to a persistent Docker volume.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(instance_path, 'network_doc.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- File Upload Settings ---
    UPLOAD_FOLDER = os.path.join(instance_path, 'uploads', 'pdf_templates')
    ALLOWED_EXTENSIONS = {'pdf'}
    MAX_PDF_FILES = 5

    # --- Application Constants ---
    MAX_HOPS = 5
