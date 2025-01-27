from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()

def create_app():
    app = Flask(__name__)

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # Directory of this script
    DATABASE_PATH = os.path.join(BASE_DIR, 'database', 'mobile_cafe.db')
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{DATABASE_PATH}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Ensure the database directory exists
    DATABASE_DIR = os.path.join(BASE_DIR, 'database')
    if not os.path.exists(DATABASE_DIR):
        os.makedirs(DATABASE_DIR)


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


    from app.routes.quantity_conversions import bp as conversions_bp
    app.register_blueprint(conversions_bp)

    from app.routes.ingredients import bp as ingredients_bp
    app.register_blueprint(ingredients_bp)

    return app