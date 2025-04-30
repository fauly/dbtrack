# app/routes/ingredients.py
from flask import Blueprint, render_template
from app.models.ingredient import Ingredient
from app.services.ingredients import IngredientService

ingredients_bp = Blueprint('ingredients', __name__, url_prefix='/ingredients')

@ingredients_bp.route('/')
def index():
    service = IngredientService()
    ingredients = service.get_all()
    return render_template(
        'ingredients/index.html',
        Ingredient=Ingredient,
        ingredients=ingredients,
        field_meta=Ingredient.__field_meta__
    )
