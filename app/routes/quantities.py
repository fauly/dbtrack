from flask import Blueprint, render_template, request
from sqlalchemy import asc, desc
from app.services.quantities import QuantityService
from app.models.quantity import Quantity
from app.utils import parse_query_filters

quantities_bp = Blueprint('quantities', __name__, template_folder='templates', url_prefix='/quantities')

@quantities_bp.route('/')
def index():
    raw_q = request.args.get('query','').strip()
    filters, order_by = parse_query_filters(Quantity, raw_q)

    quantities = QuantityService.find(filters=filters, order_by=order_by)
    rows       = [QuantityService.to_dict(q) for q in quantities]
    columns    = ['name','base_unit','base_amt','note']

    return render_template(
      'quantities/index.html',
      rows=rows,
      columns=columns,
      fields=columns,       # for the “Any column” dropdown
      query=raw_q
    )