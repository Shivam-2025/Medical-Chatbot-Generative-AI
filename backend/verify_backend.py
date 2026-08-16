import os
import sys
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parent))

def check_env():
    print("=== 1. Checking Configuration and Environment ===")
    from src.config import settings
    
    print(f"Data Directory: {settings.DATA_DIR}")
    print(f"Pinecone Index Name: {settings.PINECONE_INDEX_NAME}")
    print(f"Embeddings Model: {settings.EMBEDDINGS_MODEL}")
    
    groq_key_set = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "your_groq_api_key_here")
    pinecone_key_set = bool(settings.PINECONE_API_KEY and settings.PINECONE_API_KEY != "your_pinecone_api_key_here")
    
    print(f"GROQ_API_KEY configured: {groq_key_set}")
    print(f"PINECONE_API_KEY configured: {pinecone_key_set}")
    print(f"Security API_KEY: {'[SET]' if settings.API_KEY else '[NOT SET]'}")
    
    if not (groq_key_set and pinecone_key_set):
        print("\n[WARNING] Please update the .env file in backend/ with your active Groq and Pinecone API keys.")
    return settings, groq_key_set, pinecone_key_set

def test_document_processor(settings):
    print("\n=== 2. Testing Document Processor ===")
    from src.document_processor import split_documents
    from langchain_core.documents import Document
    
    # Test text splitter
    test_docs = [Document(page_content="This is a test paragraph to verify text splitting. " * 15, metadata={"source": "test.pdf"})]
    chunks = split_documents(test_docs, chunk_size=100, chunk_overlap=10)
    print(f"Successfully split test document into {len(chunks)} chunks.")
    
def test_embeddings():
    print("\n=== 3. Testing Local Embeddings ===")
    try:
        from src.vector_store import get_embeddings
        print("Loading embeddings model (this may download sentence-transformers if not cached)...")
        embeddings = get_embeddings()
        res = embeddings.embed_query("Test query")
        print(f"Success! Generated embeddings. Dimension count: {len(res)}")
    except Exception as e:
        print(f"Embeddings failed to load: {e}")
        print("Please ensure sentence-transformers is installed.")

def main():
    print("Starting Medical Bot Backend Verification...\n")
    try:
        settings, openai_set, pinecone_set = check_env()
        test_document_processor(settings)
        test_embeddings()
        
        print("\n=== Verification Summary ===")
        print("To start the server, follow these commands:")
        print("  cd backend")
        print("  pip install -r requirements.txt")
        print("  python -m uvicorn main:app --reload --port 8000")
        print("\nOnce running, access the interactive API docs at: http://localhost:8000/docs")
        
    except Exception as e:
        print(f"\nVerification failed with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
