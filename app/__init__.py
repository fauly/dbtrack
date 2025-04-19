# app\__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from app.db import db
from app.routes import register_blueprints


def create_app():
    app = Flask(__name__, instance_relative_config=False)
    app.config.from_object('app.config.Config')

    db.init_app(app)
    register_blueprints(app)

    print(f" ✓ App initialized with DB: {app.config['SQLALCHEMY_DATABASE_URI']}")

    return app
