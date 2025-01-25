from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from config import DevelopmentConfig

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config.from_object(DevelopmentConfig)  # Use DevelopmentConfig or ProductionConfig
    db.init_app(app)

    from .routes import app as routes
    app.register_blueprint(routes)

    with app.app_context():
        db.create_all()

    return app


