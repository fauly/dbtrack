# app/services/base.py

from app.db import (
    create_record,
    get_all,
    get_by_id,
    update_record,
    delete_record,
    get_or_404,
    query_with_filters,
    bulk_create,
    exists,
    model_to_dict
)

class BaseService:
    model = None  # Must be set in subclass

    @classmethod
    def create(cls, **kwargs):
        return create_record(cls.model, **kwargs)

    @classmethod
    def get_all(cls, order_by=None):
        return get_all(cls.model, order_by=order_by)

    @classmethod
    def get_by_id(cls, record_id):
        return get_by_id(cls.model, record_id)

    @classmethod
    def get_or_404(cls, record_id):
        return get_or_404(cls.model, record_id)

    @classmethod
    def update(cls, record_id, **kwargs):
        return update_record(cls.model, record_id, **kwargs)

    @classmethod
    def delete(cls, record_id):
        return delete_record(cls.model, record_id)

    @classmethod
    def find(cls, filters=None, order_by=None, limit=None, offset=None):
        """
        filters can be:
          • a dict of {field_name: value}        → exact match on each field  
          • a single SQLAlchemy expression         → applied as-is  
          • an iterable of SQLAlchemy expressions  → all applied in AND
        """
        query = cls.model.query

        # Normalize filters into a list of SQLAlchemy expressions
        exprs = []
        if isinstance(filters, dict):
            for field, val in filters.items():
                col = getattr(cls.model, field, None)
                if col is not None:
                    exprs.append(col == val)
        elif filters is not None:
            # if it's already a single expression or list/tuple
            try:
                # treat it as iterable of expressions
                for f in filters:
                    exprs.append(f)
            except TypeError:
                # single expression
                exprs = [filters]

        # Apply all expressions
        for f in exprs:
            query = query.filter(f)

        # Sorting / pagination
        if order_by is not None:
            query = query.order_by(order_by)
        if limit is not None:
            query = query.limit(limit)
        if offset is not None:
            query = query.offset(offset)

        return query.all()

    @classmethod
    def bulk_create(cls, data_list):
        return bulk_create(cls.model, data_list)

    @classmethod
    def exists(cls, **filters):
        return exists(cls.model, **filters)

    @classmethod
    def to_dict(cls, instance, exclude_fields=None):
        return model_to_dict(instance, exclude_fields)
