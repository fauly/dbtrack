# app\utils.py

import re
from sqlalchemy import or_, and_, cast, String

_operator_map = {
    'icontains': lambda col, val: col.ilike(f'%{val}%'),
    'gte':       lambda col, val: col >= val,
    'lte':       lambda col, val: col <= val,
    'eq':        lambda col, val: col == val,
}

def parse_query_filters(Model, query_str):
    """Parse a query string into SQLAlchemy filters."""
    filters = []
    order_by = None
    
    # Split on filter tokens while preserving the tokens
    parts = query_str.split('<')
    
    # Process filter tokens
    for i, part in enumerate(parts):
        if i == 0:
            # Enhanced free text: support word-by-word search across all columns
            terms = part.strip().split()
            if terms:
                for word in terms:
                    word_conditions = []
                    for column in Model.__table__.columns:
                        if column.type.python_type == str:
                            word_conditions.append(column.ilike(f'%{word}%'))
                        elif column.type.python_type in (int, float):
                            try:
                                numeric_value = float(word)
                                word_conditions.append(column == numeric_value)
                                word_conditions.append(cast(column, String).ilike(f'%{word}%'))
                            except ValueError:
                                continue
                    if word_conditions:
                        filters.append(or_(*word_conditions))
            continue

            
        # Handle filter tokens
        token_part = part.strip()
        if not token_part.endswith('>'):
            # This part contains both a filter and free text
            token_end = token_part.find('>')
            if token_end == -1:
                continue
                
            filter_part = token_part[:token_end]
            free_text = token_part[token_end + 1:].strip()
        else:
            filter_part = token_part[:-1]  # Remove closing '>'
            free_text = ''
            
        components = filter_part.split('__')
        filter_type = components[0]
        
        if filter_type == 'search':
            term = components[1]
            column_conditions = []
            for column in Model.__table__.columns:
                if column.type.python_type == str:
                    column_conditions.append(column.ilike(f'%{term}%'))
                elif column.type.python_type in (int, float):
                    try:
                        numeric_value = float(term)
                        column_conditions.append(column == numeric_value)
                        column_conditions.append(cast(column, String).ilike(f'%{term}%'))
                    except ValueError:
                        continue
            if column_conditions:
                filters.append(or_(*column_conditions))
                
        elif filter_type == 'condition':
            col_name, op, value = components[1:]
            column = getattr(Model, col_name)
            
            # Convert value to the appropriate type based on column type
            try:
                if column.type.python_type in (int, float):
                    typed_value = float(value)
                elif column.type.python_type == bool:
                    typed_value = value.lower() in ('true', 't', '1', 'yes', 'y')
                else:
                    typed_value = value
            except (ValueError, TypeError):
                typed_value = value
            
            op_map = {
            'equal': lambda col, val: col == val,
            'not_equal': lambda col, val: col != val,
            'greater_than': lambda col, val: col > val,
            'greater_than_or_equal': lambda col, val: col >= val,
            'less_than': lambda col, val: col < val,
            'less_than_or_equal': lambda col, val: col <= val,
            'contains': lambda col, val: col.ilike(f'%{val}%') if col.type.python_type == str else None
            }

            if op in op_map:
                clause = op_map[op](column, typed_value)
                if clause is not None:
                    filters.append(clause)
            else:
                print(f"Unknown operator: {op}")
            
        elif filter_type == 'between':
            col_name, min_val, max_val = components[1:]
            column = getattr(Model, col_name)
            try:
                if column.type.python_type in (int, float):
                    typed_min = float(min_val)
                    typed_max = float(max_val)
                else:
                    typed_min = min_val
                    typed_max = max_val
                filters.append(column.between(typed_min, typed_max))
            except (ValueError, TypeError):
                filters.append(column.between(min_val, max_val))
            
        elif filter_type == 'sort':
            col_name, direction = components[1:]
            column = getattr(Model, col_name)
            order_by = column.desc() if direction == 'desc' else column.asc()
            
        # Handle any free text after the token
        if free_text:
            column_conditions = []
            for column in Model.__table__.columns:
                if column.type.python_type == str:
                    column_conditions.append(column.ilike(f'%{free_text}%'))
                elif column.type.python_type in (int, float):
                    try:
                        numeric_value = float(free_text)
                        column_conditions.append(column == numeric_value)
                        column_conditions.append(cast(column, String).ilike(f'%{free_text}%'))
                    except ValueError:
                        continue
            if column_conditions:
                filters.append(or_(*column_conditions))
    
    # Apply AND between all filters
    final_filter = and_(*filters) if filters else None
    if final_filter is not None:
        return [final_filter], order_by
    return [], order_by
