# app/models/ingredient.py
from sqlalchemy import Column, Integer, String, Float, JSON, event
from sqlalchemy.orm import validates
from app.db import db
from app.services.quantities import QuantityService
from typing import Optional

class Ingredient(db.Model):
    __tablename__ = "ingredients"

    id              = Column(Integer, primary_key=True)
    name            = Column(String, nullable=False, unique=True)
    default_unit    = Column(String, nullable=True)
    store_quantity  = Column(Float, nullable=True)
    store_unit      = Column(String, nullable=True)
    cost_per_purchase   = Column(Float, nullable=True)
    ref_unit_cost   = Column(Float, nullable=True)
    density         = Column(Float, nullable=True)
    notes           = Column(JSON, default={})

    __field_meta__ = {
    "name": {
        "label": "Ingredient Name",
        "type": "text",
        "readonly": False,
        "required": True,
        "source": None
    },
    "default_unit": {
        "label": "Default Unit",
        "type": "select",
        "readonly": False,
        "required": False,
        "source": "quantities.base_unit"
    },
    "store_quantity": {
        "label": "Purchase Quantity",
        "type": "number",
        "readonly": False,
        "required": False,
        "source": None
    },
    "store_unit": {
        "label": "Purchase Unit",
        "type": "select",
        "readonly": False,
        "required": False,
        "source": "quantities.name"
    },
    "cost_per_purchase": {
        "label": "Cost per Purchase",
        "type": "number",
        "readonly": False,
        "required": False,
        "source": None
    },
    "ref_unit_cost": {
        "label": "Reference Unit Cost",
        "type": "number",
        "readonly": True,  # This field is computed
        "required": False,
        "source": None,
        "editable": False  # Additional flag to prevent any form of editing
    },
    "density": {
        "label": "Density",
        "type": "number",
        "readonly": False,
        "required": False,
        "source": None
    },
    "notes": {
        "label": "Notes",
        "type": "json",
        "readonly": False,
        "required": False,
        "source": None
    }
    }

    def update_ref_unit_cost(self):
        """Calculate and update the reference unit cost based on purchase info"""
        if all([self.store_quantity, self.cost_per_purchase, 
                self.store_unit, self.default_unit]):
            try:
                # Convert store quantity to base unit quantity
                base_qty = QuantityService.convert_to_base_unit(
                    self.store_quantity,
                    self.store_unit
                )
                # Calculate cost per base unit
                self.ref_unit_cost = self.cost_per_purchase / base_qty
            except Exception:
                self.ref_unit_cost = None
        else:
            self.ref_unit_cost = None

    @validates("store_quantity", "cost_per_purchase", "density")
    def validate_float(self, key: str, value: Optional[str | float]) -> Optional[float]:
        if value is None or value == "":
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    @validates("default_unit", "store_unit")
    def validate_unit(self, key: str, value: Optional[str]) -> Optional[str]:
        if not value:
            return None
        return value.lower().strip()

# Set up event listeners to update ref_unit_cost
@event.listens_for(Ingredient, 'before_update')
def update_ref_unit_cost_listener(mapper, connection, target):
    target.update_ref_unit_cost()

