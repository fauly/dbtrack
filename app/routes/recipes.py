from flask import Blueprint, request, jsonify
from app.models import db, Recipe, Tag, Ingredients

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

    # Handle tags (convert list into actual tag objects)
    tag_names = data.get("tags", [])
    tags = []
    for tag_name in tag_names:
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)
        tags.append(tag)

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
        notes=data.get("notes", ""),
        prep_time=data.get("prep_time", ""),
        cook_time=data.get("cook_time", ""),
        total_time=data.get("total_time", ""),
    )
    
    recipe.tags.extend(tags)
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

    # Handle tags (update to match input)
    tag_names = data.get("tags", [])
    tags = []
    for tag_name in tag_names:
        tag = Tag.query.filter_by(name=tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.session.add(tag)
        tags.append(tag)

    # Update fields
    recipe.name = data.get("name", recipe.name)
    recipe.servings_type = data.get("servings_type", recipe.servings_type)
    recipe.servings_count = data.get("servings_count", recipe.servings_count)
    recipe.ingredients = data.get("ingredients", recipe.ingredients)
    recipe.steps = data.get("steps", recipe.steps)
    recipe.tags = tags
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

    tags = Tag.query.filter(Tag.name.ilike(f"%{query}%")).limit(4).all()
    return jsonify([tag.name for tag in tags])

# Search for ingredients
@bp.route("/ingredients/search", methods=["GET"])
def search_ingredients():
    query = request.args.get("query", "").strip()
    if not query:
        return jsonify([])

    ingredients = Ingredients.query.filter(Ingredients.name.ilike(f"%{query}%")).limit(5).all()
    return jsonify([ingredient.to_dict() for ingredient in ingredients])

# Add a new tag
@bp.route("/tags", methods=["POST"])
def add_tag():
    data = request.json
    tag_name = data.get("name", "").strip()

    if not tag_name:
        return jsonify({"error": "Tag name is required."}), 400

    existing_tag = Tag.query.filter_by(name=tag_name).first()
    if existing_tag:
        return jsonify({"message": "Tag already exists.", "tag": existing_tag.to_dict()}), 200

    new_tag = Tag(name=tag_name)
    db.session.add(new_tag)
    db.session.commit()

    return jsonify({"message": "Tag added successfully!", "tag": new_tag.to_dict()}), 201
