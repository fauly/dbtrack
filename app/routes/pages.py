from flask import Blueprint, render_template, abort
from jinja2 import TemplateNotFound
import os

bp = Blueprint("pages", __name__)

# Register dynamic routes for all HTML files in the templates directory
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), '..', 'templates')

@bp.route("/", defaults={"page": "index"})
@bp.route("/<page>")
def render_page(page):
    try:
        # Render the requested template
        return render_template(f"{page}.html")
    except TemplateNotFound:
        # Return a 404 page if the template doesn't exist
        abort(404)
