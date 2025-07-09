# backend/extensions.py
# This file initializes Flask extensions like SQLAlchemy and Flask-Migrate.

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

# Initialize SQLAlchemy and Migrate instances
# These will be initialized with the Flask app in app.py
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()
