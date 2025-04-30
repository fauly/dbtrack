# app/services/quantities.py
from app.services.base import BaseService
from app.models.quantity import Quantity

class QuantityService(BaseService):
    model = Quantity

    @classmethod
    def get_all(cls, order_by=None):
        """Get all quantities, optionally ordered"""
        query = cls.model.query
        if order_by is None:
            # Default to ordering by name
            order_by = cls.model.name
        return cls.find(order_by=order_by)

    @classmethod
    def get_all_ordered(cls):
        return cls.get_all(order_by=cls.model.name)

    @classmethod
    def convert_to_base_unit(cls, qty: float, unit: str) -> float:
        """
        Given qty of “unit” (e.g. 5, "kg"), look up that name in Quantities.name,
        take its base_amt and base_unit, and return qty * base_amt.
        """
        results = cls.find(filters={"name": unit}, limit=1)
        if not results:
            raise ValueError(f"No such quantity '{unit}'")
        record = results[0]
        # record.base_amt = how much of record.base_unit equals 1 {unit}
        # so 5 {unit} → 5 * record.base_amt {record.base_unit}
        return qty * record.base_amt

