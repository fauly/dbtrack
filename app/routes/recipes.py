from flask import Blueprint, request, jsonify
from app.models import db, Recipe, Tag

bp = Blueprint("recipes", __name__, url_prefix="/api/recipes")

# Get all recipes
@bp.route("/", methods=["GET"])
def get_recipes():
    recipes = Recipe.query.all()
    return jsonify([recipe.to_dict() for recipe in recipes])

# Add a new recipe
@bp.route("/", methods=["POST"])
def add_recipe():
    data = request.json
    if not data or "name" not in data or "servings" not in data or "ingredients" not in data or "steps" not in data:
        return jsonify({"error": "Invalid input. 'name', 'servings', 'ingredients', and 'steps' are required."}), 400

    # Create a new recipe
    recipe = Recipe(
        name=data["name"],
        servings=data["servings"],
        servings_type=data.get("servings_type", ""),
        tags=data.get("tags", ""),
        ingredients=data["ingredients"],
        steps=data["steps"]
    )
    db.session.add(recipe)
    db.session.commit()
    return jsonify({"message": "Recipe added successfully!", "data": recipe.to_dict()}), 201

# Update a recipe
@bp.route("/<int:recipe_id>", methods=["PUT"])
def update_recipe(recipe_id):
    data = request.json
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": f"Recipe with id '{recipe_id}' not found."}), 404

    # Update fields
    recipe.name = data.get("name", recipe.name)
    recipe.servings = data.get("servings", recipe.servings)
    recipe.servings_type = data.get("servings_type", recipe.servings_type)
    recipe.tags = data.get("tags", recipe.tags)
    recipe.ingredients = data.get("ingredients", recipe.ingredients)
    recipe.steps = data.get("steps", recipe.steps)

    db.session.commit()
    return jsonify({"message": "Recipe updated successfully!", "data": recipe.to_dict()}), 200

# Delete a recipe
@bp.route("/<int:recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": f"Recipe with id '{recipe_id}' not found."}), 404

    db.session.delete(recipe)
    db.session.commit()
    return jsonify({"message": f"Recipe with id '{recipe_id}' deleted."}), 200
