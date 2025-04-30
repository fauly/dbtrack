# app/routes/quantities.py
from flask import Blueprint, render_template, request, jsonify
from app.services.quantities import QuantityService
from app.models.quantity import Quantity
from app.utils import parse_query_filters

quantities_bp = Blueprint(
    'quantities',
    __name__,
    template_folder='templates',
    url_prefix='/quantities'
)

@quantities_bp.route('/')
def index():
    raw_q = request.args.get('query','').strip()
    # Define which columns are in your table & which fields to search
    columns = ['name','base_unit','base_amt','note']
    fields  = columns        # for "any‑column" autocomplete
    
    # Pull your model‑level field metadata, if you defined one:
    field_meta = getattr(Quantity, '__field_meta__', {})

    # Apply any tokenized filters:
    filters, order_by = parse_query_filters(Quantity, raw_q)
    quantities = QuantityService.find(filters=filters, order_by=order_by)
    rows = [ QuantityService.to_dict(q) for q in quantities ]

    return render_template(
      'quantities/index.html',
      rows=rows,
      columns=columns,
      fields=fields,
      query=raw_q,
      field_meta=field_meta
    )

@quantities_bp.route('/api/convert')
def convert():
    """Convert a quantity from one unit to another"""
    try:
        from_unit = request.args.get('from_unit')
        to_unit = request.args.get('to_unit')
        value = float(request.args.get('value', 0))

        if not all([from_unit, to_unit, value]):
            return jsonify({"error": "Missing required parameters"}), 400

        # First convert to base unit
        base_value = QuantityService.convert_to_base_unit(value, from_unit)
        
        # Then convert to target unit
        target_units = QuantityService.find(filters={"name": to_unit}, limit=1)
        if not target_units:
            return jsonify({"error": f"Unknown unit: {to_unit}"}), 400
            
        target_unit = target_units[0]
        result = base_value / target_unit.base_amt

        return jsonify({
            "value": result,
            "from": from_unit,
            "to": to_unit,
            "original": value
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Conversion failed"}), 500
