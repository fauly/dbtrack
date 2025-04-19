from flask import Blueprint, request, jsonify
from app.models import db, QuantityConversion

bp = Blueprint("quantity_conversions", __name__, url_prefix="/api/quantity-conversions")

@bp.route("/", methods=["GET"])
def get_conversions():
    conversions = QuantityConversion.query.all()
    return jsonify([conversion.to_dict() for conversion in conversions])

@bp.route("/", methods=["POST"])
def add_conversion():
    data = request.json
    required_fields = ['unit_name', 'reference_unit_name', 'reference_unit_amount', 'unit_type']
    if not data or not all(field in data for field in required_fields):
        return jsonify({
            "error": "Invalid input. 'unit_name', 'reference_unit_name', 'reference_unit_amount', and 'unit_type' are required."
        }), 400

    existing_conversion = QuantityConversion.query.filter_by(unit_name=data["unit_name"]).first()
    if existing_conversion:
        return jsonify({"error": f"Conversion for unit '{data['unit_name']}' already exists."}), 400

    conversion = QuantityConversion(
        unit_name=data["unit_name"],
        reference_unit_name=data["reference_unit_name"],
        reference_unit_amount=data["reference_unit_amount"],
        unit_type=data["unit_type"]
    )
    db.session.add(conversion)
    db.session.commit()
    return jsonify({"message": "Conversion added successfully!", "data": conversion.to_dict()}), 201

@bp.route("/<unit_name>", methods=["PUT"])
def update_conversion(unit_name):
    data = request.json
    conversion = QuantityConversion.query.filter_by(unit_name=unit_name).first()
    if not conversion:
        return jsonify({"error": f"Conversion with unit '{unit_name}' not found."}), 404

    # Update fields
    for field in ['reference_unit_name', 'reference_unit_amount', 'unit_type']:
        if field in data:
            setattr(conversion, field, data[field])

    db.session.commit()
    return jsonify({"message": "Conversion updated successfully!", "data": conversion.to_dict()}), 200

@bp.route("/<int:unit_id>", methods=["DELETE"])
def delete_conversion(unit_id):
    conversion = QuantityConversion.query.filter_by(id=unit_id).first()
    if not conversion:
        return jsonify({"error": f"Conversion with id '{unit_id}' not found."}), 404

    db.session.delete(conversion)
    db.session.commit()
    return jsonify({"message": f"Conversion with id '{unit_id}' deleted."}), 200

@bp.route("/convert", methods=["POST"])
def convert_units():
    data = request.json
    if not data or not all(k in data for k in ['amount', 'from_unit', 'to_unit']):
        return jsonify({
            "error": "Invalid input. 'amount', 'from_unit', and 'to_unit' are required."
        }), 400

    try:
        amount = float(data['amount'])
    except ValueError:
        return jsonify({"error": "Amount must be a number"}), 400

    result = QuantityConversion.convert_units(amount, data['from_unit'], data['to_unit'])
    
    if result is None:
        return jsonify({
            "error": "Cannot convert between these units. They may be incompatible or not found."
        }), 400

    return jsonify({
        "result": result,
        "from_unit": data['from_unit'],
        "to_unit": data['to_unit'],
        "original_amount": amount
    })
