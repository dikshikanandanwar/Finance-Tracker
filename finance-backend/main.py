import os
import json
import traceback
import joblib
import pandas as pd
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict
from contextlib import asynccontextmanager
from typing import List, Optional
from dotenv import load_dotenv

# 1. NEW GENAI SDK IMPORT
from google import genai

load_dotenv() 

GENAI_API_KEY = os.getenv("GEMINI_API_KEY")
ACTIVE_MODEL_NAME = "gemini-2.5-flash" # Dropped the "models/" prefix for the new SDK

# Initialize the new GenAI Client
client = None
if not GENAI_API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY not found in .env file.")
else:
    try:
        client = genai.Client(api_key=GENAI_API_KEY)
        print("✅ Gemini API Client Loaded.")
    except Exception as e:
        print(f"❌ Error configuring Gemini: {e}")

ml_artifacts = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load ML Models on startup
    try:
        model = joblib.load('finance_income_growth_model.pkl')
        ml_artifacts['classification_model'] = model
        print("✅ Finance ML Artifacts loaded successfully.")
    except FileNotFoundError:
        print("❌ Error: 'finance_income_growth_model.pkl' not found.")
        ml_artifacts['error'] = True
    
    yield
    ml_artifacts.clear()

app = FastAPI(lifespan=lifespan)

# --- CORS MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class FinanceInput(BaseModel):
    income: float = Field(..., alias="Income")
    age: float = Field(..., alias="Age")
    dependents: float = Field(..., alias="Dependents")
    occupation: int = Field(..., alias="Occupation") 
    city_tier: int = Field(..., alias="City_Tier")   
    total_expense: float = Field(..., alias="Total_Expense")
    desired_savings: float = Field(..., alias="Desired_Savings")

    model_config = ConfigDict(populate_by_name=True, extra="allow")

class ChatRequest(BaseModel):
    message: str
    user_context: Optional[str] = "General User"

class TestRequest(BaseModel):
    difficulty: str
    test_type: str
    learning_context: str

class TestResult(BaseModel):
    score: int
    total_marks: int
    wrong_answers: List[str]

# --- Helper Logic ---
def get_financial_recommendations(risk_level: str, savings_potential: float):
    if risk_level == 'High':
        return [
            "Strictly track daily expenses for 30 days.",
            "Cut down non-essential discretionary spending immediately.",
            "Build a 1-month emergency fund before investing."
        ]
    elif risk_level == 'Medium':
        return [
            "Automate your savings transfer on payday.",
            "Review subscriptions and recurring bills.",
            "Aim to save at least 20% of your income."
        ]
    else:
        return [
            "Explore diversified investment portfolios.",
            "Maximize your retirement account contributions.",
            "Consider aggressive growth assets for long-term wealth."
        ]


# --- Endpoints ---
@app.get("/")
def home():
    return {"message": "Finance AI API is running", "docs": "/docs"}

@app.post("/predict")
def predict(finance_data: FinanceInput):
    if ml_artifacts.get('error'): raise HTTPException(500, "Artifacts not loaded")
    try:
        data = finance_data.model_dump(by_alias=True)
        
        # 1. RUN THE ML MODEL
        expected_cols = ['Income', 'Age', 'Dependents', 'Occupation', 'City_Tier', 'Total_Expense', 'Desired_Savings']
        X_input = pd.DataFrame([data], columns=expected_cols)
        
        model = ml_artifacts['classification_model']
        
        prediction = model.predict(X_input)[0] 
        probabilities = model.predict_proba(X_input)[0]
        classes = model.classes_ 
        prob_dict = {classes[i]: round(float(probabilities[i]), 4) for i in range(len(classes))}

        bad_prob = prob_dict.get('Bad', 0.0)
        if bad_prob > 0.6: risk = 'High'
        elif bad_prob > 0.3: risk = 'Medium'
        else: risk = 'Low'

        savings_potential = data['Income'] - data['Total_Expense']

        # 2. FEED ML RESULTS TO GEMINI LLM
        prompt = f"""
        Act as an expert, encouraging financial advisor for an app named Finance.
        The user has a monthly income of ${data['Income']}, total expenses of ${data['Total_Expense']}, and a savings goal of ${data['Desired_Savings']}.
        Our ML model rated their financial health as '{prediction}' with a '{risk}' risk level.
        
        Based on this data, provide:
        1. A brief, 2-sentence encouraging summary of their situation.
        2. Three highly specific, actionable financial tips.
        
        Respond ONLY in this exact JSON format, with no markdown formatting or backticks:
        {{
            "ai_summary": "Your 2 sentence summary here.",
            "ai_tips": ["Tip 1", "Tip 2", "Tip 3"]
        }}
        """
        
        try:
            # NEW SDK CALL
            response = client.models.generate_content(
                model=ACTIVE_MODEL_NAME,
                contents=prompt
            )
            cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
            llm_data = json.loads(cleaned_text)
        except Exception as e:
            print(f"LLM Generation Error: {e}")
            llm_data = {
                "ai_summary": "We analyzed your finances. Keep tracking your budget to reach your goals!",
                "ai_tips": ["Review your largest expense categories.", "Automate your savings.", "Build an emergency fund."]
            }

        return {
            "financial_health": prediction,
            "probabilities": prob_dict,
            "risk_level": risk,
            "monthly_savings_potential": savings_potential,
            "ai_summary": llm_data.get("ai_summary", "Analysis complete."),
            "ai_tips": llm_data.get("ai_tips", [])
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))

@app.post("/recommend")
def recommend(finance_data: FinanceInput):
    if ml_artifacts.get('error'): raise HTTPException(500, "Artifacts not loaded")
    try:
        predict_result = predict(finance_data)
        risk = predict_result["risk_level"]
        savings = predict_result["monthly_savings_potential"]
        interventions = get_financial_recommendations(risk, savings)

        return {
            "risk_level": risk,
            "financial_health": predict_result["financial_health"],
            "recommended_actions": interventions
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(500, str(e))


@app.post("/chat_with_advisor")
async def chat_with_advisor(request: ChatRequest):
    prompt = f"""Act as a highly knowledgeable, encouraging, and friendly financial advisor. 
    Use emojis to make it engaging 📈💡. Keep answers concise and practical. 
    Context: {request.user_context}. 
    User Question: {request.message}"""
    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME,
            contents=prompt
        )
        return {"reply": response.text}
    except Exception as e:
        traceback.print_exc()
        return {"reply": f"Sorry, my financial data stream is down. Error: {str(e)}"}

@app.post("/generate_full_test")
async def generate_full_test(req: TestRequest):
    count = 10 
    prompt = f"""
    Create a {count}-question multiple-choice quiz about Personal Finance.
    Topic Focus: {req.test_type}
    Difficulty: {req.difficulty}.
    Learning Context: {req.learning_context}
    
    Make the questions practical and scenario-based where possible.
    Respond ONLY in this exact JSON format:
    {{
        "questions": [
            {{
                "id": 1,
                "subject": "{req.test_type}",
                "question": "Question text...",
                "options": ["A", "B", "C", "D"],
                "correct_answer": "Option A"
            }}
        ]
    }}
    """
    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME,
            contents=prompt
        )
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
    except Exception as e:
        traceback.print_exc()
        return {"questions": []}

@app.post("/analyze_test_results")
async def analyze_test_results(res: TestResult):
    prompt = f"""
    User scored {res.score}/{res.total_marks} on a finance quiz.
    Concepts they struggled with: {', '.join(res.wrong_answers[:5])}.
    Provide: 1. A short, encouraging feedback sentence. 2. A specific financial concept they should review.
    Respond strictly in JSON format: {{ "feedback": "...", "recommendation": "..." }}
    """
    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME,
            contents=prompt
        )
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
    except Exception as e:
        return {"feedback": "Good effort analyzing your finances!", "recommendation": "Review the concepts you missed."}

@app.post("/generate_financial_plan")
async def generate_financial_plan(finance_data: FinanceInput):
    data = finance_data.model_dump(by_alias=True)
    # FIX: Replaced invalid single quotes with double quotes for strict JSON parsing
    prompt = f"""Analyze this user's finances: 
    Income: {data['Income']}, Expenses: {data['Total_Expense']}, Savings Goal: {data['Desired_Savings']}, Age: {data['Age']}.
    Return strictly JSON format: 
    {{ "analysis": "Short text analysis", "action_steps": ["step 1", "step 2"], "youtube_search_queries": ["query 1"] }}
    """
    try:
        response = client.models.generate_content(
            model=ACTIVE_MODEL_NAME,
            contents=prompt
        )
        cleaned_text = response.text.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned_text)
    except Exception as e:
        return {}

# 3. RENDER PORT BINDING FIX
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)