import os
import sys

# Add the application's directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the app object from main.pyca
from app import app as application
