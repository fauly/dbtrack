from flask import Blueprint, request, jsonify
from app.models import db, Ingredients

bp = Blueprint("ingredients", __name__, url_prefix="/api/ingredients")

# Get all ingredient references
@bp.route("/", methods=["GET"])
def get_ingredients():
    ingredients = Ingredients.query.all()
    return jsonify([ingredient.to_dict() for ingredient in ingredients])

# Add a new ingredient reference
@bp.route("/", methods=["POST"])
def add_ingredient():
    data = request.json
    if not data or "name" not in data or "allergens" not in data or "cost" not in data or "source" not in data:
        return jsonify({"error": "Invalid input. 'name', 'allergens', 'cost', and 'source' are required."}), 400

    # Check if the ingredient already exists
    existing_ingredient = Ingredients.query.filter_by(name=data["name"]).first()
    if existing_ingredient:
        return jsonify({"error": f"Ingredient '{data['name']}' already exists."}), 400

    # Add to the database
    ingredient = Ingredients(
        name=data["name"],
        allergens=data["allergens"],
        cost=data["cost"],
        source=data["source"]
    )
    db.session.add(ingredient)
    db.session.commit()
    return jsonify({"message": "Ingredient added successfully!", "data": ingredient.to_dict()}), 201

# Update an existing ingredient
@bp.route("/<int:ingredient_id>", methods=["PUT"])
def update_ingredient(ingredient_id):
    data = request.json
    ingredient = Ingredients.query.get(ingredient_id)
    if not ingredient:
        return jsonify({"error": f"Ingredient with id '{ingredient_id}' not found."}), 404

    # Update fields
    if "name" in data:
        ingredient.name = data["name"]
    if "allergens" in data:
        ingredient.allergens = data["allergens"]
    if "cost" in data:
        ingredient.cost = data["cost"]
    if "source" in data:
        ingredient.source = data["source"]

    db.session.commit()
    return jsonify({"message": "Ingredient updated successfully!", "data": ingredient.to_dict()}), 200

# Delete an ingredient
@bp.route("/<int:ingredient_id>", methods=["DELETE"])
def delete_ingredient(ingredient_id):
    ingredient = Ingredients.query.get(ingredient_id)
    if not ingredient:
        return jsonify({"error": f"Ingredient with id '{ingredient_id}' not found."}), 404

    db.session.delete(ingredient)
    db.session.commit()
    return jsonify({"message": f"Ingredient with id '{ingredient_id}' deleted."}), 200
