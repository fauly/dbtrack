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
    if not data or "unit" not in data or "reference_unit" not in data or "value" not in data:
        return jsonify({"error": "Invalid input. 'unit', 'reference_unit', and 'value' are required."}), 400

    # Check if the unit already exists
    if QuantityConversion.query.filter_by(unit=data["unit"]).first():
        return jsonify({"error": f"Conversion for unit '{data['unit']}' already exists."}), 400

    # Add to the database
    conversion = QuantityConversion(
        unit=data["unit"],
        reference_unit=data["reference_unit"],
        value=data["value"],
    )
    db.session.add(conversion)
    db.session.commit()
    return jsonify({"message": "Conversion added successfully!", "data": conversion.to_dict()}), 201

# Update an existing quantity conversion
@bp.route("/<unit>", methods=["PUT"])
def update_conversion(unit):
    data = request.json
    conversion = QuantityConversion.query.filter_by(unit=unit).first()
    if not conversion:
        return jsonify({"error": f"Conversion with unit '{unit}' not found."}), 404

    # Update fields
    if "reference_unit" in data:
        conversion.reference_unit = data["reference_unit"]
    if "value" in data:
        conversion.value = data["value"]

    db.session.commit()
    return jsonify({"message": "Conversion updated successfully!", "data": conversion.to_dict()}), 200

# Delete a quantity conversion
@bp.route("/<unit>", methods=["DELETE"])
def delete_conversion(unit):
    conversion = QuantityConversion.query.filter_by(unit=unit).first()
    if not conversion:
        return jsonify({"error": f"Conversion with unit '{unit}' not found."}), 404

    db.session.delete(conversion)
    db.session.commit()
    return jsonify({"message": f"Conversion with unit '{unit}' deleted."}), 200
