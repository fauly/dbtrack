from datetime import date
from app.models.daily_report import DailyReport
from app.services.base import BaseService

class DailyLogService(BaseService):
    model = DailyReport

    @classmethod
    def create(cls, data, notes, date_created=None):
        return super().create(
            data=data,
            notes=notes,
            date=date_created or date.today()
        )

    @classmethod
    def update(cls, report_id, data=None, notes=None):
        updates = {}
        if data is not None:
            updates["data"] = data
        if notes is not None:
            updates["notes"] = notes
        return super().update(report_id, **updates)

    @classmethod
    def summarize(cls, report):
        note = (report.notes or '')[:100]
        return f"{report.date}, Notes: {note}…"
