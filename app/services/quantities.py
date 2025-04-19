# app/services/quantities.py
from app.services.base import BaseService
from app.models.quantity import Quantity

class QuantityService(BaseService):
    model = Quantity

    @classmethod
    def get_all_ordered(cls):
        return cls.get_all(order_by=cls.model.name)