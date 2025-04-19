# app/config.py
import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "a-secret-key")
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(basedir, 'data', 'boots.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
