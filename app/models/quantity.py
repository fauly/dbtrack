# app/models/quantity.py

from app.db import db

class Quantity(db.Model):
    __tablename__ = "quantity"

    id        = db.Column(db.Integer, primary_key=True)
    name      = db.Column(db.String(100), nullable=False, unique=True)
    base_unit = db.Column(db.String(20), nullable=False)
    base_amt  = db.Column(db.Float,   nullable=False, default=1.0)
    note      = db.Column(db.Text)

    __field_meta__ = {
        "name": {
            "label":    "Quantity Name",
            "type":     "text",
            "required": True
        },
        "base_unit": {
            "label":    "Base Unit",
            "type":     "select",
            "source":   "quantities.base_unit",
            "required": True
        },
        "base_amt": {
            "label":    "Base Amount",
            "type":     "number",
            "required": True
        },
        "note": {
            "label": "Notes",
            "type":  "text"
        }
    }
