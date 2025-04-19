from flask import Blueprint, render_template
from datetime import datetime

home_bp = Blueprint('home', __name__, template_folder='../templates/home')

@home_bp.route('/')
def index():
    return render_template('home/index.html',current_year=datetime.today().year)
