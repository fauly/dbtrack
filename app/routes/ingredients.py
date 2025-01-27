from flask import Blueprint, request, jsonify
from app.models import db, IngredientReference

bp = Blueprint("ingredients", __name__, url_prefix="/api/ingredients")

# Get all ingredient references
@bp.route("/", methods=["GET"])
def get_ingredients():
    ingredients = IngredientReference.query.all()
    return jsonify([ingredient.to_dict() for ingredient in ingredients])

# Add a new ingredient reference
@bp.route("/", methods=["POST"])
def add_ingredient():
    data = request.json
    if not data or "name" not in data or "allergens" not in data or "cost_per_unit" not in data or "sourcing_info" not in data:
        return jsonify({"error": "Invalid input. 'name', 'allergens', 'cost_per_unit', and 'sourcing_info' are required."}), 400

    # Check if the ingredient already exists
    existing_ingredient = IngredientReference.query.filter_by(name=data["name"]).first()
    if existing_ingredient:
        return jsonify({"error": f"Ingredient '{data['name']}' already exists."}), 400

    # Add to the database
    ingredient = IngredientReference(
        name=data["name"],
        allergens=data["allergens"],
        cost_per_unit=data["cost_per_unit"],
        sourcing_info=data["sourcing_info"]
    )
    db.session.add(ingredient)
    db.session.commit()
    return jsonify({"message": "Ingredient added successfully!", "data": ingredient.to_dict()}), 201

# Update an existing ingredient
@bp.route("/<int:ingredient_id>", methods=["PUT"])
def update_ingredient(ingredient_id):
    data = request.json
    ingredient = IngredientReference.query.get(ingredient_id)
    if not ingredient:
        return jsonify({"error": f"Ingredient with id '{ingredient_id}' not found."}), 404

    # Update fields
    if "name" in data:
        ingredient.name = data["name"]
    if "allergens" in data:
        ingredient.allergens = data["allergens"]
    if "cost_per_unit" in data:
        ingredient.cost_per_unit = data["cost_per_unit"]
    if "sourcing_info" in data:
        ingredient.sourcing_info = data["sourcing_info"]

    db.session.commit()
    return jsonify({"message": "Ingredient updated successfully!", "data": ingredient.to_dict()}), 200

# Delete an ingredient
@bp.route("/<int:ingredient_id>", methods=["DELETE"])
def delete_ingredient(ingredient_id):
    ingredient = IngredientReference.query.get(ingredient_id)
    if not ingredient:
        return jsonify({"error": f"Ingredient with id '{ingredient_id}' not found."}), 404

    db.session.delete(ingredient)
    db.session.commit()
    return jsonify({"message": f"Ingredient with id '{ingredient_id}' deleted."}), 200
