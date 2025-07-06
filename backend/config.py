# backend/config.py
import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'sqlite:///network_doc.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # PDF Uploads Configuration
    # Use app.root_path for paths relative to the Flask app instance
    UPLOAD_FOLDER_RELATIVE = 'uploads/pdf_templates'
    UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(__file__)), UPLOAD_FOLDER_RELATIVE)
    ALLOWED_EXTENSIONS = {'pdf'}
    MAX_PDF_FILES = 5

    # Global Constants
    MAX_HOPS = 5 # Maximum number of hops for connections export/import

    # Ensure the upload folder exists when config is accessed
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)