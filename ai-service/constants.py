# import os

# # Get OpenAI API key from environment variable
# # For production, always use environment variables instead of hardcoded keys
# openai_key = os.getenv('OPENAI_API_KEY')

# if not openai_key:
#     print("Error: OPENAI_API_KEY environment variable not set!")
#     print("Please set your OpenAI API key as an environment variable.")
#     print("Example: export OPENAI_API_KEY='your-api-key-here' (Linux/Mac)")
#     print("Example: set OPENAI_API_KEY=your-api-key-here (Windows)")
#     raise ValueError("OpenAI API key is required but not found in environment variables")

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get OpenAI API key from environment variable
# For production, always use environment variables instead of hardcoded keys
openai_key = os.getenv('OPENAI_API_KEY')

if not openai_key:
    print("Error: OPENAI_API_KEY environment variable not set!")
    print("Please set your OpenAI API key as an environment variable.")
    print("Example: export OPENAI_API_KEY='your-api-key-here' (Linux/Mac)")
    print("Example: set OPENAI_API_KEY=your-api-key-here (Windows)")
    print("Or create a .env file in the backend directory with: OPENAI_API_KEY=your-api-key-here")
    raise ValueError("OpenAI API key is required but not found in environment variables")