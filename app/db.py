# app\db.py

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# ==== Reusable DB CRUD Utilities ====

def create_record(model_class, **kwargs):
    obj = model_class(**kwargs)
    db.session.add(obj)
    db.session.commit()
    return obj

def get_all(model_class, order_by=None):
    query = model_class.query
    if order_by:
        query = query.order_by(order_by)
    return query.all()

def get_by_id(model_class, record_id):
    return model_class.query.get(record_id)

def update_record(model_class, record_id, **kwargs):
    obj = model_class.query.get(record_id)
    if not obj:
        return None
    for key, value in kwargs.items():
        setattr(obj, key, value)
    db.session.commit()
    return obj

def delete_record(model_class, record_id):
    obj = model_class.query.get(record_id)
    if not obj:
        return False
    db.session.delete(obj)
    db.session.commit()
    return True

def get_or_404(model_class, record_id):
    obj = model_class.query.get(record_id)
    if not obj:
        raise ValueError(f"{model_class.__name__} with ID {record_id} not found")
    return obj

def query_with_filters(model_class, filters=None, order_by=None, limit=None, offset=None):
    query = model_class.query
    if filters:
        query = query.filter_by(**filters)
    if order_by:
        query = query.order_by(order_by)
    if limit is not None:
        query = query.limit(limit)
    if offset is not None:
        query = query.offset(offset)
    return query.all()

def bulk_create(model_class, data_list):
    objs = [model_class(**data) for data in data_list]
    db.session.bulk_save_objects(objs)
    db.session.commit()
    return objs

def exists(model_class, **kwargs):
    return db.session.query(model_class.query.filter_by(**kwargs).exists()).scalar()

def model_to_dict(obj, exclude_fields=None):
    exclude_fields = exclude_fields or []
    return {
        c.name: getattr(obj, c.name)
        for c in obj.__table__.columns
        if c.name not in exclude_fields
    }
