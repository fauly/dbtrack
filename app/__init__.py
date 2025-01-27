from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)

    # Configure app
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from app.routes.pages import bp as pages_bp
    app.register_blueprint(pages_bp)

    from app.routes.error_handlers import errors as errors_bp
    app.register_blueprint(errors_bp)


    from app.routes.daily_report import bp as daily_report_bp
    app.register_blueprint(daily_report_bp, url_prefix="/api")

    return app