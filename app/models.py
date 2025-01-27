from . import db
from datetime import datetime, date

class DailyLog(db.Model):
    __tablename__ = "daily_logs"

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=date.today, nullable=False)
    last_edited = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    temperatures = db.Column(db.JSON, default={})
    opening_clean = db.Column(db.DateTime, nullable=True)
    midday_clean = db.Column(db.DateTime, nullable=True)
    end_of_day_clean = db.Column(db.DateTime, nullable=True)
    grey_water = db.Column(db.DateTime, nullable=True)
    bin_emptied = db.Column(db.DateTime, nullable=True)

    stock_used = db.Column(db.JSON, default={})
    additional_notes = db.Column(db.Text, nullable=True)
    food_waste = db.Column(db.Integer, nullable=True)
    customer_feedback = db.Column(db.Text, nullable=True)
    equipment_issues = db.Column(db.Text, nullable=True)


class QuantityConversion(db.Model):
    __tablename__ = "quantity_conversions"

    id = db.Column(db.Integer, primary_key=True)
    unit_name = db.Column(db.String(50), nullable=False, unique=True)
    reference_unit_name = db.Column(db.String(50), nullable=False)
    reference_unit_amount = db.Column(db.Float, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "unit_name": self.unit_name,
            "reference_unit_name": self.reference_unit_name,
            "reference_unit_amount": self.reference_unit_amount,
        }
