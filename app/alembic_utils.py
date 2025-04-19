# app/alembic_utils.py

import subprocess
import os

def run_alembic_upgrade():
    subprocess.run(["alembic", "upgrade", "head"], check=True)

def run_alembic_autogenerate(message="auto migration"):
    subprocess.run(["alembic", "revision", "--autogenerate", "-m", message], check=True)

def ensure_latest_schema():
    # Generate a temporary migration (won't apply it yet)
    result = subprocess.run(
        ["alembic", "revision", "--autogenerate", "-m", "check for pending"],
        capture_output=True,
        text=True
    )

    # If changes detected, apply the migration
    if "Generating" in result.stdout and "nothing to do" not in result.stdout.lower():
        print("🔧 Detected model changes: applying migration…")
        last_line = result.stdout.splitlines()[-1]
        rev_path = last_line.split("Generating ")[-1].strip()
        print("➕ Generated:", rev_path)
        run_alembic_upgrade()
    else:
        print("✅ Database schema is up to date.")
