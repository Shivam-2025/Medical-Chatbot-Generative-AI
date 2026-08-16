import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve paths relative to this config file
SRC_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SRC_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

# Load environment variables from backend/.env
env_path = BACKEND_DIR / ".env"
load_dotenv(dotenv_path=env_path)

class Settings:
    GROQ_API_KEY: str = os.getenv("Groq_API_KEY", "")
    PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
    PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "medicalbot")
    API_KEY: str = os.getenv("API_KEY", "supersecretkey123")
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "*")
    
    # HuggingFace API key / Token for serverless inference
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY") or os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("HF_TOKEN") or ""
    
    # Path to data directory containing PDF books
    DATA_DIR: Path = ROOT_DIR / "Data"
    
    # HuggingFace embeddings model
    EMBEDDINGS_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

settings = Settings()
