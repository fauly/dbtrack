# run.py

from app import create_app
from app.models import db
from app.alembic_utils import ensure_latest_schema

app = create_app()

with app.app_context():
    db.create_all()
    ensure_latest_schema()

if __name__ == '__main__':
    app.run(debug=True)