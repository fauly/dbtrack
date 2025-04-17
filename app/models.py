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
    unit_type = db.Column(db.String(20), nullable=False)  # mass, volume, count, etc.

    def to_dict(self):
        return {
            "id": self.id,
            "unit_name": self.unit_name,
            "reference_unit_name": self.reference_unit_name,
            "reference_unit_amount": self.reference_unit_amount,
            "unit_type": self.unit_type
        }

    @staticmethod
    def convert_units(amount, from_unit, to_unit):
        """Convert between compatible units"""
        from_conv = QuantityConversion.query.filter_by(unit_name=from_unit).first()
        to_conv = QuantityConversion.query.filter_by(unit_name=to_unit).first()
        
        if not from_conv or not to_conv:
            return None
            
        if from_conv.unit_type != to_conv.unit_type:
            return None
            
        # Convert to reference unit first
        reference_amount = amount * from_conv.reference_unit_amount
        
        # Then convert to target unit
        return reference_amount / to_conv.reference_unit_amount

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
    name = db.Column(db.String(255), nullable=False, unique=True)
    servings_type = db.Column(db.String(50), nullable=False)
    servings_count = db.Column(db.Integer, nullable=False, default=1)
    ingredients = db.Column(db.JSON, nullable=False)  # Now includes recipe references
    steps = db.Column(db.JSON, nullable=False)  # Now includes sections and nested steps
    tags = db.relationship('Tag', secondary='recipe_tags', backref=db.backref('recipes', lazy='dynamic'))
    notes = db.Column(db.Text, nullable=True)
    prep_time = db.Column(db.String(50), nullable=True)
    cook_time = db.Column(db.String(50), nullable=True)
    total_time = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, onupdate=db.func.now())

    def to_dict(self, include_referenced_recipes=True):
        recipe_dict = {
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

        if include_referenced_recipes and self.ingredients:
            referenced_recipes = []
            for item in self.ingredients:
                if item.get("type") == "recipe":
                    referenced_recipe = Recipe.query.get(item.get("recipe_id"))
                    if referenced_recipe:
                        referenced_recipes.append(referenced_recipe.to_dict(include_referenced_recipes=False))
            recipe_dict["referenced_recipes"] = referenced_recipes

        return recipe_dict
    
recipe_tags = db.Table(
    'recipe_tags',
    db.Column('recipe_id', db.Integer, db.ForeignKey('recipes.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tags.id'), primary_key=True)
)
