import os
from functools import lru_cache
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

ACTIVE_MODEL = "gemini-3.1-flash-lite"

@lru_cache(maxsize=1)
def get_extraction_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=ACTIVE_MODEL,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.0,
        max_output_tokens=512,
    )

@lru_cache(maxsize=1)
def get_advisor_llm() -> ChatGoogleGenerativeAI:
    return ChatGoogleGenerativeAI(
        model=ACTIVE_MODEL,
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=0.7,
        max_output_tokens=256,
    )