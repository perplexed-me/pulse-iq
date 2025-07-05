## Integrate with open ai
import os
from constants import openai_key
from langchain_openai import OpenAI
from langchain.prompts import PromptTemplate
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
import uvicorn

# Set OpenAI API key
os.environ["OPENAI_API_KEY"] = openai_key

# Initialize FastAPI app
app = FastAPI(
    title="AI Health Assistant API",
    description="API for AI-powered health consultation",
    version="1.0.0"
)

# Add CORS middleware to allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class HealthQueryRequest(BaseModel):
    message: str

class HealthQueryResponse(BaseModel):
    response: str
    status: str

# Initialize LangChain components
llm = OpenAI(temperature=0.8)

# First prompt template
first_input_prompt = PromptTemplate(
    input_variables=["condition"],
    template="""Explain the medical condition '{condition}' in very simple language that a village person can understand. 
    Use easy words and avoid medical jargon. Structure your response as:
    
    What is {condition}?
    - Simple explanation in 2-3 sentences
    
    What causes it?
    - List main causes in simple points
    
    Keep it short and easy to understand."""
)

# Second prompt template
second_input_prompt = PromptTemplate(
    input_variables=["condition_info"],
    template="""Based on this condition information: {condition_info}

    Now explain the symptoms, treatment, and doctor recommendations in very simple language for village people. Structure your response as:

    What signs should you look for?
    - List symptoms in simple words (like "pain", "swelling", "fever")
    - Use everyday language, not medical terms

    What can you do at home?
    - Simple home remedies or first aid
    - When to rest, use ice, drink water, etc.

    Which doctor should you see?
    - Recommend the specific medical department/specialty (like Medicine, Gynecology, Gastroenterology, Cardiology, Orthopedics, Dermatology, ENT, Pediatrics, Psychiatry, etc.)
    - Explain why this doctor is the right choice for this condition
    - Mention if it's urgent or can wait

    When should you see a doctor immediately?
    - Warning signs that need urgent medical help
    - Use simple, clear language

    Keep everything short and easy to understand. Use bullet points."""
)

# Third prompt template for department recommendation
third_input_prompt = PromptTemplate(
    input_variables=["condition"],
    template="""For the health condition '{condition}', recommend the most appropriate medical department/specialist.

    Choose from these common departments:
    - General Medicine (for general health issues, fever, infections)
    - Cardiology (for heart problems, chest pain, blood pressure)
    - Gastroenterology (for stomach, digestive issues, acidity)
    - Gynecology (for women's health, periods, pregnancy)
    - Orthopedics (for bone, joint, muscle problems)
    - Dermatology (for skin, hair, nail problems)
    - ENT (for ear, nose, throat problems)
    - Pediatrics (for children's health issues)
    - Psychiatry (for mental health, depression, anxiety)
    - Neurology (for headaches, seizures, nerve problems)
    - Urology (for kidney, bladder, urinary problems)
    - Ophthalmology (for eye problems)
    - Emergency Medicine (for urgent/serious conditions)

    Respond with:
    **Recommended Department:** [Department Name]
    **Why:** [Simple explanation of why this department is best for this condition]
    **Urgency:** [Urgent/Soon/Routine] - [brief explanation]"""
)

# Create the chain using the new RunnableSequence syntax
def create_health_response(condition: str) -> dict:
    """Create a health response using the modern LangChain approach"""
    
    # First chain - explain the condition
    first_chain = first_input_prompt | llm
    condition_info = first_chain.invoke({"condition": condition})
    
    # Second chain - provide symptoms and treatment
    second_chain = second_input_prompt | llm
    advice = second_chain.invoke({"condition_info": condition_info})
    
    # Third chain - recommend department
    third_chain = third_input_prompt | llm
    department = third_chain.invoke({"condition": condition})
    
    return {
        "condition_info": condition_info,
        "advice": advice,
        "department": department
    }

@app.get("/")
async def root():
    return {"message": "AI Health Assistant API is running"}

@app.post("/chat", response_model=HealthQueryResponse)
async def chat_with_ai(request: HealthQueryRequest):
    try:
        if not request.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        # Process the health query using the modern LangChain approach
        response = create_health_response(request.message)
        
        # Combine the responses
        combined_response = f"""🏥 **What is this condition?**
{response['condition_info']}

💡 **Signs, Home Care & Treatment**
{response['advice']}

👨‍⚕️ **Which Doctor to See**
{response['department']}

🚨 **Important**: This is only for information. Always talk to a doctor or health worker for proper treatment. Don't ignore serious symptoms!"""
        
        return HealthQueryResponse(
            response=combined_response,
            status="success"
        )
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Health check endpoint for Docker and load balancer
@app.get("/health")
async def health_check():
    """Health check endpoint for service monitoring"""
    return {
        "status": "healthy",
        "service": "AI Health Assistant",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
