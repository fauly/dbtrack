import csv
from app.models import db, Ingredients
from app import create_app

# Initialize the Flask app context
app = create_app()
app.app_context().push()

# Path to the CSV file
csv_file_path = "data/ingredients.csv"

def import_ingredients():
    try:
        with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)

            for row in reader:
                # Check if the ingredient already exists
                existing_ingredient = Ingredients.query.filter_by(name=row["ingredient"]).first()
                if existing_ingredient:
                    print(f"Ingredient '{row['ingredient']}' already exists. Skipping...")
                    continue

                # Create and add the ingredient
                ingredient = Ingredients(
                    name=row["ingredient"].strip(),
                    allergens=row["allergens"].strip() if row["allergens"] else None,
                    dietary_mentions=row["dietary_mentions"].strip() if row["dietary_mentions"] else None,
                    source=row["source"].strip() if row["source"] else None,
                    lead_time=row["lead_time"].strip() if row["lead_time"] else None,
                    quantity=float(row["quantity"]) if row["quantity"] else None,
                    unit=row["unit"].strip() if row["unit"] else None,
                    cost=float(row["cost"]) if row["cost"] else 0.0,  # Default cost to 0.0 if missing
                )

                db.session.add(ingredient)
                print(f"Added ingredient: {ingredient.name}")

        # Commit the changes
        db.session.commit()
        print("Import complete!")
    except Exception as e:
        db.session.rollback()
        print(f"Error during import: {e}")

# Run the import function
import_ingredients()
