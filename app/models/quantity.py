# app/models/quantity.py

from app.db import db

class Quantity(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    base_unit = db.Column(db.String(20), nullable=False)
    base_amt = db.Column(db.Float, nullable=False, default=1.0)
    note = db.Column(db.Text)
