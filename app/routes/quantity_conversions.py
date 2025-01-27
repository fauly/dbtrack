from flask import Blueprint, request, jsonify
from app.models import db, QuantityConversion

bp = Blueprint("quantity_conversions", __name__, url_prefix="/api/quantity-conversions")

# Get all quantity conversions
@bp.route("/", methods=["GET"])
def get_conversions():
    conversions = QuantityConversion.query.all()
    return jsonify([conversion.to_dict() for conversion in conversions])

# Add a new quantity conversion
@bp.route("/", methods=["POST"])
def add_conversion():
    data = request.json
    if not data or "unit_name" not in data or "reference_unit_name" not in data or "reference_unit_amount" not in data:
        return jsonify({"error": "Invalid input. 'unit_name', 'reference_unit_name', and 'reference_unit_amount' are required."}), 400

    existing_conversion = QuantityConversion.query.filter_by(unit_name=data["unit_name"]).first()
    if existing_conversion:
        return jsonify({"error": f"Conversion for unit '{data['unit_name']}' already exists."}), 400

    conversion = QuantityConversion(
        unit_name=data["unit_name"],
        reference_unit_name=data["reference_unit_name"],
        reference_unit_amount=data["reference_unit_amount"],
    )
    db.session.add(conversion)
    db.session.commit()
    return jsonify({"message": "Conversion added successfully!", "data": conversion.to_dict()}), 201

# Update an existing quantity conversion
@bp.route("/<unit_name>", methods=["PUT"])
def update_conversion(unit_name):
    data = request.json
    conversion = QuantityConversion.query.filter_by(unit_name=unit_name).first()
    if not conversion:
        return jsonify({"error": f"Conversion with unit '{unit_name}' not found."}), 404

    # Update fields
    if "reference_unit_name" in data:
        conversion.reference_unit_name = data["reference_unit_name"]
    if "reference_unit_amount" in data:
        conversion.reference_unit_amount = data["reference_unit_amount"]

    db.session.commit()
    return jsonify({"message": "Conversion updated successfully!", "data": conversion.to_dict()}), 200

# Delete a quantity conversion
@bp.route("/<unit_name>", methods=["DELETE"])
def delete_conversion(unit_name):
    conversion = QuantityConversion.query.filter_by(unit_name=unit_name).first()
    if not conversion:
        return jsonify({"error": f"Conversion with unit '{unit_name}' not found."}), 404

    db.session.delete(conversion)
    db.session.commit()
    return jsonify({"message": f"Conversion with unit '{unit_name}' deleted."}), 200
