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
    required_fields = ["name", "servings_type", "servings_count", "ingredients", "steps"]

    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # Handle tags (convert comma-separated string into a list)
    tags = data.get("tags", "").split(", ") if data.get("tags") else []

    # Check if the recipe already exists
    existing_recipe = Recipe.query.filter_by(name=data["name"]).first()
    if existing_recipe:
        return jsonify({"error": f"Recipe '{data['name']}' already exists."}), 400

    recipe = Recipe(
        name=data["name"],
        servings_type=data["servings_type"],
        servings_count=data["servings_count"],
        ingredients=data["ingredients"],
        steps=data["steps"],
        tags=", ".join(tags),
        notes=data.get("notes", ""),
        prep_time=data.get("prep_time", ""),
        cook_time=data.get("cook_time", ""),
        total_time=data.get("total_time", ""),
    )
    db.session.add(recipe)
    db.session.commit()

    return jsonify({"message": "Recipe added successfully!", "data": recipe.to_dict()}), 201

# Update an existing recipe
@bp.route("/<int:recipe_id>", methods=["PUT"])
def update_recipe(recipe_id):
    data = request.json
    recipe = Recipe.query.get(recipe_id)

    if not recipe:
        return jsonify({"error": f"Recipe with ID {recipe_id} not found."}), 404

    # Update fields
    recipe.name = data.get("name", recipe.name)
    recipe.servings_type = data.get("servings_type", recipe.servings_type)
    recipe.servings_count = data.get("servings_count", recipe.servings_count)
    recipe.ingredients = data.get("ingredients", recipe.ingredients)
    recipe.steps = data.get("steps", recipe.steps)
    recipe.tags = ", ".join(data.get("tags", "").split(", ")) if data.get("tags") else recipe.tags
    recipe.notes = data.get("notes", recipe.notes)
    recipe.prep_time = data.get("prep_time", recipe.prep_time)
    recipe.cook_time = data.get("cook_time", recipe.cook_time)
    recipe.total_time = data.get("total_time", recipe.total_time)

    db.session.commit()
    return jsonify({"message": "Recipe updated successfully!", "data": recipe.to_dict()}), 200

# Delete a recipe
@bp.route("/<int:recipe_id>", methods=["DELETE"])
def delete_recipe(recipe_id):
    recipe = Recipe.query.get(recipe_id)
    if not recipe:
        return jsonify({"error": f"Recipe with ID {recipe_id} not found."}), 404

    db.session.delete(recipe)
    db.session.commit()
    return jsonify({"message": f"Recipe with ID {recipe_id} deleted."}), 200

# Search for tags
@bp.route("/tags/search", methods=["GET"])
def search_tags():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify([])

    tags = Tag.query.filter(Tag.name.ilike(f"%{query}%")).limit(10).all()
    return jsonify([tag.name for tag in tags])

# Search for serving types
@bp.route("/servings/search", methods=["GET"])
def search_servings():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify([])

    servings = db.session.query(Recipe.servings_type).distinct().filter(
        Recipe.servings_type.ilike(f"%{query}%")
    ).limit(10).all()

    return jsonify([serving[0] for serving in servings if serving[0]])

