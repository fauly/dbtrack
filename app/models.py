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

class Ingredients(db.Model):
    __tablename__ = "ingredients"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)  # Ingredient name
    allergens = db.Column(db.String(255), nullable=True)  # Allergen information
    dietary_mentions = db.Column(db.String(255), nullable=True)  # Vegan, Vegetarian, etc.
    source = db.Column(db.String(255), nullable=True)  # Sourcing information
    lead_time = db.Column(db.String(50), nullable=True)  # Procurement time
    quantity = db.Column(db.Float, nullable=True)  # Available quantity
    unit = db.Column(db.String(20), nullable=True)  # Unit of measurement
    cost = db.Column(db.Float, nullable=True)  # Cost per unit
    reference_cost = db.Column(db.Float, nullable=True)  # Optional reference cost for comparison

    # Relationship to NutritionalValue table
    nutritional_values = db.relationship("NutritionalValue", backref="ingredient", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "allergens": self.allergens,
            "dietary_mentions": self.dietary_mentions,
            "source": self.source,
            "lead_time": self.lead_time,
            "quantity": self.quantity,
            "unit": self.unit,
            "cost": self.cost,
            "reference_cost": self.reference_cost,
        }

class NutritionalValue(db.Model):
    __tablename__ = "nutritional_values"

    id = db.Column(db.Integer, primary_key=True)
    ingredient_id = db.Column(db.Integer, db.ForeignKey("ingredients.id"), nullable=False)  # Reference to Ingredient
    calories = db.Column(db.Float, nullable=True)  # Calories per unit
    protein = db.Column(db.Float, nullable=True)  # Protein content (grams)
    carbs = db.Column(db.Float, nullable=True)  # Carbohydrates content (grams)
    fat = db.Column(db.Float, nullable=True)  # Fat content (grams)
    fiber = db.Column(db.Float, nullable=True)  # Fiber content (grams)
    sugar = db.Column(db.Float, nullable=True)  # Sugar content (grams)
    other_nutrients = db.Column(db.JSON, nullable=True)  # For any additional nutrients (JSON)

    def to_dict(self):
        return {
            "id": self.id,
            "ingredient_id": self.ingredient_id,
            "calories": self.calories,
            "protein": self.protein,
            "carbs": self.carbs,
            "fat": self.fat,
            "fiber": self.fiber,
            "sugar": self.sugar,
            "other_nutrients": self.other_nutrients,
        }
