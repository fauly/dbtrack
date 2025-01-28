from flask import Blueprint, request, jsonify
from app.models import db, Recipe

bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")

@bp.route("/", methods=["GET"])
def get_recipes():
    recipes = Recipe.query.all()
    return jsonify([recipe.to_dict() for recipe in recipes])

@bp.route("/", methods=["POST"])
def add_recipe():
    data = request.json
    if not data or "name" not in data:
        return jsonify({"error": "Recipe name is required."}), 400

    recipe = Recipe(
        name=data["name"],
        servings_type=data["servingsType"],
        servings_count=data.get("servingsCount", 0),
        tags=data.get("tags", ""),
        prep_time=data.get("prepTime", ""),
        cook_time=data.get("cookTime", ""),
        total_time=data.get("totalTime", ""),
        ingredients=data.get("ingredients", "[]"),
        steps=data.get("steps", "[]"),
        notes=data.get("notes", ""),
    )
    db.session.add(recipe)
    db.session.commit()
    return jsonify({"message": "Recipe added successfully!", "data": recipe.to_dict()}), 201

@bp.route("/<int:recipe_id>", methods=["PUT"])
def update_recipe(recipe_id):
    data = request.json
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": f"Recipe with id '{recipe_id}' not found."}), 404

    recipe.name = data.get("name", recipe.name)
    recipe.servings_type = data.get("servingsType", recipe.servings_type)
    recipe.servings_count = data.get("servingsCount", recipe.servings_count)
    recipe.tags = data.get("tags", recipe.tags)
    recipe.prep_time = data.get("prepTime", recipe.prep_time)
    recipe.cook_time = data.get("cookTime", recipe.cook_time)
    recipe.total_time = data.get("totalTime", recipe.total_time)
    recipe.ingredients = data.get("ingredients", recipe.ingredients)
    recipe.steps = data.get("steps", recipe.steps)
    recipe.notes = data.get("notes", recipe.notes)

    db.session.commit()
    return jsonify({"message": "Recipe updated successfully!", "data": recipe.to_dict()}), 200

@bp.route("/<int:recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": f"Recipe with id '{recipe_id}' not found."}), 404

    db.session.delete(recipe)
    db.session.commit()
    return jsonify({"message": f"Recipe with id '{recipe_id}' deleted."}), 200
