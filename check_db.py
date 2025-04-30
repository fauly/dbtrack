import os  
from app import create_app  
from app.models.quantity import Quantity  
app = create_app()  
"with app.app_context():"  
"    quantities = Quantity.query.all()"  
"    print('Found quantities:', len(quantities))"  
"    for q in quantities:"  
"        print(f'  {q.name}: {q.base_amt} {q.base_unit}')"  
