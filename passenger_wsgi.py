import os
import sys

# Add the application directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

# Import the Flask app from run.py
from run import app as application
