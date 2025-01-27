import os
import sys

# Add the application's directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app

# Create the WSGI application object
application = create_app()
