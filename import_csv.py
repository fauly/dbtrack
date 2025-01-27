import csv
from app import create_app, db
from app.models import QuantityConversion

app = create_app()
with app.app_context():
    csv_file_path = "data/quantity_conversions.csv"

    with open(csv_file_path, "r") as file:
        reader = csv.DictReader(file)

        for row in reader:
            # Check if the unit already exists
            existing_conversion = QuantityConversion.query.filter_by(unit_name=row["unit_name"]).first()
            if existing_conversion:
                print(f"Skipping existing unit: {row['unit_name']}")
                continue

            # Create and add the conversion
            conversion = QuantityConversion(
                unit_name=row["unit_name"],
                reference_unit_amount=float(row["reference_unit_amount"]),
                reference_unit_name=row["reference_unit_name"],
            )
            db.session.add(conversion)

        db.session.commit()
        print("CSV data imported successfully!")
