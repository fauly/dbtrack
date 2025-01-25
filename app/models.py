from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class DailyLog(db.Model):
    __tablename__ = 'daily_logs'

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    fridge_temp_8 = db.Column(db.String(10))
    fridge_temp_9 = db.Column(db.String(10))
    fridge_temp_10 = db.Column(db.String(10))
    fridge_temp_11 = db.Column(db.String(10))
    fridge_temp_12 = db.Column(db.String(10))
    fridge_temp_1 = db.Column(db.String(10))
    fridge_temp_2 = db.Column(db.String(10))
    fridge_temp_3 = db.Column(db.String(10))
    fridge_temp_4 = db.Column(db.String(10))
    freezer_temp_8 = db.Column(db.String(10))
    freezer_temp_9 = db.Column(db.String(10))
    freezer_temp_10 = db.Column(db.String(10))
    freezer_temp_11 = db.Column(db.String(10))
    freezer_temp_12 = db.Column(db.String(10))
    freezer_temp_1 = db.Column(db.String(10))
    freezer_temp_2 = db.Column(db.String(10))
    freezer_temp_3 = db.Column(db.String(10))
    freezer_temp_4 = db.Column(db.String(10))
    opening_clean = db.Column(db.Boolean, default=False)
    midday_clean = db.Column(db.Boolean, default=False)
    end_of_day_clean = db.Column(db.Boolean, default=False)
    grey_water = db.Column(db.Boolean, default=False)
    bin_emptied = db.Column(db.Boolean, default=False)

    def __repr__(self):
        return f"<DailyLog {self.date}>"
