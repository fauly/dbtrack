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
    if not data or "name" not in data or "servings_type" not in data or "servings_count" not in data:
        return jsonify({"error": "Invalid input. 'name', 'servings_type', and 'servings_count' are required."}), 400

    # Process tags
    tag_names = data.get("tags", [])
    tags = []
    for name in tag_names:
        tag = Tag.query.filter_by(name=name).first()
        if not tag:
            tag = Tag(name=name)
            db.session.add(tag)
        tags.append(tag)

    # Create and save the recipe
    recipe = Recipe(
        name=data["name"],
        servings_type=data["servings_type"],
        servings_count=data["servings_count"],
        ingredients=data.get("ingredients", []),
        steps=data.get("steps", []),
        tags=tags,
        notes=data.get("notes", ""),
        prep_time=data.get("prep_time", ""),
        cook_time=data.get("cook_time", ""),
        total_time=data.get("total_time", ""),
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
    if "name" in data:
        recipe.name = data["name"]
    if "servings_type" in data:
        recipe.servings_type = data["servings_type"]
    if "servings_count" in data:
        recipe.servings_count = data["servings_count"]
    if "ingredients" in data:
        recipe.ingredients = data["ingredients"]
    if "steps" in data:
        recipe.steps = data["steps"]
    if "notes" in data:
        recipe.notes = data["notes"]
    if "prep_time" in data:
        recipe.prep_time = data["prep_time"]
    if "cook_time" in data:
        recipe.cook_time = data["cook_time"]
    if "total_time" in data:
        recipe.total_time = data["total_time"]

    # Update tags
    if "tags" in data:
        tag_names = data["tags"]
        tags = []
        for name in tag_names:
            tag = Tag.query.filter_by(name=name).first()
            if not tag:
                tag = Tag(name=name)
                db.session.add(tag)
            tags.append(tag)
        recipe.tags = tags

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
