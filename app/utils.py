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
            # Handle free text before any tokens
            if part.strip():
                search_term = part.strip()
                column_conditions = []
                for column in Model.__table__.columns:
                    if column.type.python_type == str:
                        column_conditions.append(column.ilike(f'%{search_term}%'))
                    elif column.type.python_type in (int, float):
                        try:
                            numeric_value = float(search_term)
                            column_conditions.append(column == numeric_value)
                            column_conditions.append(cast(column, String).ilike(f'%{search_term}%'))
                        except ValueError:
                            continue
                if column_conditions:
                    filters.append(or_(*column_conditions))
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
            
            # For string columns, use case-sensitive comparison by default
            # Only use case-insensitive for 'contains' operator
            if column.type.python_type == str and op != 'contains':
                if op == '=': filters.append(column == typed_value)
                elif op == '!=': filters.append(column != typed_value)
                elif op == '>': filters.append(column > typed_value)
                elif op == '>=': filters.append(column >= typed_value)
                elif op == '<': filters.append(column < typed_value)
                elif op == '<=': filters.append(column <= typed_value)
            else:
                # For non-string columns or 'contains' operator
                if op == '=': filters.append(column == typed_value)
                elif op == '!=': filters.append(column != typed_value)
                elif op == '>': filters.append(column > typed_value)
                elif op == '>=': filters.append(column >= typed_value)
                elif op == '<': filters.append(column < typed_value)
                elif op == '<=': filters.append(column <= typed_value)
                elif op == 'contains': filters.append(column.ilike(f'%{value}%'))
            
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
    return [final_filter] if final_filter else [], order_by