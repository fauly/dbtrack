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
    name = db.Column(db.String(100), nullable=False, unique=True)
    allergens = db.Column(db.String(255), nullable=True)
    dietary_mentions = db.Column(db.String(255), nullable=True)
    source = db.Column(db.String(255), nullable=True)  # Changed from sourcing_info
    lead_time = db.Column(db.String(50), nullable=True)
    quantity = db.Column(db.Float, nullable=True)
    unit = db.Column(db.String(50), nullable=True)
    cost = db.Column(db.Float, nullable=False)  # Changed from cost_per_unit

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

class Tag(db.Model):
    __tablename__ = 'tags'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name
        }


class Recipe(db.Model):
    __tablename__ = "recipes"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)  # Recipe name
    servings_type = db.Column(db.String(50), nullable=False)  # e.g., "cake", "muffin", "loaf"
    servings_count = db.Column(db.Integer, nullable=False, default=1)  # Default serving count
    ingredients = db.Column(db.JSON, nullable=False)  # JSON to store ingredient list or sub-recipe links
    steps = db.Column(db.JSON, nullable=False)  # JSON to store step-by-step instructions
    tags = db.relationship('Tag', secondary='recipe_tags', backref=db.backref('recipes', lazy='dynamic'))
    notes = db.Column(db.Text, nullable=True)  # Optional notes about the recipe
    prep_time = db.Column(db.String(50), nullable=True)  # e.g., "15 mins"
    cook_time = db.Column(db.String(50), nullable=True)  # e.g., "30 mins"
    total_time = db.Column(db.String(50), nullable=True)  # e.g., "45 mins"
    created_at = db.Column(db.DateTime, server_default=db.func.now())  # Creation timestamp
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())  # Update timestamp

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "servings_type": self.servings_type,
            "servings_count": self.servings_count,
            "ingredients": self.ingredients,
            "steps": self.steps,
            "tags": [tag.to_dict() for tag in self.tags],
            "notes": self.notes,
            "prep_time": self.prep_time,
            "cook_time": self.cook_time,
            "total_time": self.total_time,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
    
recipe_tags = db.Table(
    'recipe_tags',
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipes.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)
