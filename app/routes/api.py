# app/routes/api.py

from flask import Blueprint, request, jsonify, abort
from sqlalchemy import asc, desc
from app.utils import parse_query_filters
from app.services.quantities import QuantityService
from app.models.quantity import Quantity
from app.db import db, model_to_dict

api_bp = Blueprint('api', __name__, url_prefix='/api')

# ─── Unified registry mapping resource → (ServiceClass, ModelClass) ─────────
_service_map = {
    'quantities': (QuantityService, Quantity),
    # 'ingredients': (IngredientService, Ingredient),
    # etc.
}
# ─────────────────────────────────────────────────────────────────────────────

@api_bp.route('/search/<resource>/<field>')
def autocomplete(resource, field):
    entry = _service_map.get(resource)
    if not entry:
        abort(404, f"No such resource '{resource}'")
    Service, Model = entry

    term = request.args.get('term', '').strip()
    if not hasattr(Model, field):
        abort(400, f"No field '{field}' on {resource}")

    column = getattr(Model, field)
    q = (
        db.session.query(column)
          .filter(column.ilike(f'%{term}%'))
          .distinct()
          .limit(10)
    )
    suggestions = [row[0] for row in q]
    return jsonify(suggestions)


@api_bp.route('/<resource>', methods=['GET'])
def search_resource(resource):
    Service, Model = _service_map[resource]
    q = request.args.get('query')
    
    # Return all data if query is None or empty string
    if not q or not q.strip():
        results = Service.get_all()
    else:
        filters, order_by = parse_query_filters(Model, q)
        results = Service.find(filters=filters, order_by=order_by)
    
    return jsonify([model_to_dict(obj) for obj in results])


@api_bp.route('/<resource>', methods=['POST'])
def save_resource(resource):
    entry = _service_map.get(resource)
    if not entry:
        abort(404, f"No API service for '{resource}'")
    Service, Model = entry

    payload = request.get_json() or {}
    rid  = payload.get('id')
    data = payload.get('data', {})

    if rid:
        obj = Service.update(rid, **data)
    else:
        obj = Service.create(**data)

    return jsonify({"id": obj.id})


@api_bp.route('/<resource>/<int:rid>', methods=['DELETE'])
def delete_resource(resource, rid):
    entry = _service_map.get(resource)
    if not entry:
        abort(404, f"No API service for '{resource}'")
    Service, Model = entry

    Service.delete(rid)
    return jsonify({"status": "deleted"})
