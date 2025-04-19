import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "a-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///database/mobile_cafe.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    ENV = "development"


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    ENV = "production"


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///test_database.db"
