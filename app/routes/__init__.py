# app\routes\__init__.py

from app.routes.home import home_bp
from app.routes.daily import daily_bp
from app.routes.quantities import quantities_bp
from app.routes.api import api_bp
# from app.routes.purchases import purchases_bp
# from app.routes.ingredients import ingredients_bp
# from app.routes.units import units_bp
# from app.routes.recipes import recipes_bp
# from app.routes.bakes import bakes_bp

def register_blueprints(app):
    app.register_blueprint(api_bp)
    app.register_blueprint(home_bp,    url_prefix='')
    app.register_blueprint(daily_bp,    url_prefix='/daily')
    app.register_blueprint(quantities_bp,    url_prefix='/quantities')
    # app.register_blueprint(purchases_bp, url_prefix='/purchases')
    # app.register_blueprint(ingredients_bp, url_prefix='/ingredients')
    # app.register_blueprint(units_bp,     url_prefix='/convert')
    # app.register_blueprint(recipes_bp,   url_prefix='/recipes')
    # app.register_blueprint(bakes_bp,     url_prefix='/bakes')
