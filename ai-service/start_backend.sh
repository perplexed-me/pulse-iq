#!/bin/bash

# Script to start the AI Health Assistant backend server

echo "Starting AI Health Assistant Backend..."
echo "=================================="

# Check if virtual environment exists
if [ ! -d "myenv" ]; then
    echo "Creating virtual environment..."
    python -m venv myenv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source myenv/bin/activate

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Start the server
echo "Starting FastAPI server on http://localhost:8000"
echo "API Documentation will be available at http://localhost:8000/docs"
echo "Press Ctrl+C to stop the server"
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
