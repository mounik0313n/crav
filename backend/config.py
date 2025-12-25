import os
from dotenv import load_dotenv

# Load environment variables from a .env file (good for local development)
load_dotenv()

class Config:
    """Base configuration."""
    # These will be None if environment variables aren't set
    SECRET_KEY = os.environ.get('SECRET_KEY') 
    
    # --- Database Configuration ---
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///db.sqlite3')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = database_url
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # --- Flask-Security-Too Configuration ---
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT')
    
    SECURITY_TOKEN_AUTHENTICATION_HEADER = "Authentication-Token"
    WTF_CSRF_ENABLED = False
    SECURITY_CSRF_IGNORE_UNAUTH_ENDPOINTS = True

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds
    GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')


class ProductionConfig(Config):
    """Production configuration (used by Render)."""
    # Validation for these keys now happens in app.py
    DEBUG = False
    TESTING = False


class LocalDevelopmentConfig(Config):
    """Local development configuration."""
    DEBUG = True
    
    # --- 🛠️ THE FIX IS HERE ---
    # We add default keys for development mode.
    # These are NOT used in production.
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-replace-if-you-want')
    SECURITY_PASSWORD_SALT = os.environ.get('SECURITY_PASSWORD_SALT', 'dev-salt-replace-if-you-want')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'dev-jwt-key-replace-if-you-want')
    # --- END OF FIX ---

    # The .env file can still override the keys above
    # DATABASE_URL="sqlite:///./instance/local.db"
    # This will create a local.db file in an 'instance' folder.