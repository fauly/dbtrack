# app/models/__init__.py
from app.db import db

from app.models.daily_report import DailyReport
from app.models.quantity import Quantity

# from app.models.purchase import Purchase
# from app.models.ingredient import Ingredient
# ...and so on

# This ensures all models are known to SQLAlchemy and importable via:
# from app.models import db, DailyReport
