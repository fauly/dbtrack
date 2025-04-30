# app/services/ingredients.py
from app.services.base import BaseService
from app.models.ingredient import Ingredient
from app.db import db

class IngredientService(BaseService):
    model = Ingredient

    @classmethod
    def create(cls, **kwargs):
        obj = super().create(**kwargs)
        obj.update_ref_unit_cost()
        db.session.commit()
        return obj

    @classmethod
    def update(cls, record_id, **kwargs):
        obj = super().update(record_id, **kwargs)
        obj.update_ref_unit_cost()
        db.session.commit()
        return obj
