import os
import uuid
import json
import shutil
import logging
import asyncio
from typing import Optional
from fastapi import FastAPI, Depends, Header, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from src.config import settings
from src.document_processor import load_single_pdf, split_documents
from src.vector_store import upsert_documents, get_vector_store
from src.chain import get_rag_chain
from src.emergency import check_emergency

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("medibot-backend")

app = FastAPI(
    title="Medibot RAG Backend",
    description="FastAPI Backend for Medical Chatbot using OpenAI and Pinecone Vector Store",
    version="1.0.0"
)

# CORS setup to allow communication with the React frontend
# Clean the ALLOWED_ORIGINS env var to remove any leading/trailing quotes and spaces
raw_origins = settings.ALLOWED_ORIGINS.strip().strip("'").strip('"')
allowed_origins = [origin.strip().strip("'").strip('"').rstrip("/") for origin in raw_origins.split(",") if origin.strip()]

# Regex to support wildcard origins for local development (any port) and Vercel medibot deployments
allow_origin_regex = r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https://medibot-.*\.vercel\.app"

allow_credentials = True
if "*" in allowed_origins:
    allow_credentials = False

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request Models
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

# API Key verification dependency
async def verify_api_key(x_api_key: Optional[str] = Header(None, alias="x-api-key")):
    """
    Verify the x-api-key header matches the configured key in settings.
    """
    if settings.API_KEY and x_api_key != settings.API_KEY:
        logger.warning("API key verification failed.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key"
        )

@app.post("/new_chat")
async def new_chat():
    """
    Start a new chat session by generating a unique conversation ID.
    """
    conversation_id = str(uuid.uuid4())
    logger.info(f"Created new conversation session: {conversation_id}")
    return {"conversation_id": conversation_id}

@app.post("/chat")
async def chat(req: ChatRequest, _=Depends(verify_api_key)):
    """
    Standard question-answering endpoint (non-streaming).
    Queries the vector database, formats context, calls the LLM, and returns answer + sources.
    Uses asyncio.to_thread to prevent blocking the event loop during LLM calls.
    """
    logger.info(f"Received chat request for conversation {req.conversation_id}: {req.message[:50]}...")
    
    # Check for emergency
    emergency_response = check_emergency(req.message)
    if emergency_response:
        return {
            "answer": emergency_response,
            "sources": []
        }
        
    try:
        rag_chain = get_rag_chain()
        # Run the synchronous LangChain invoke in a thread pool so it doesn't
        # block the FastAPI event loop (which would starve health checks).
        response = await asyncio.to_thread(rag_chain.invoke, {"input": req.message})
        
        # Format sources
        sources = []
        for doc in response.get("context", []):
            title = os.path.basename(doc.metadata.get("source", "Unknown"))
            page = int(doc.metadata.get("page", 0)) + 1
            sources.append({
                "title": title,
                "page": page,
                "snippet": doc.page_content
            })
            
        return {
            "answer": response.get("answer", ""),
            "sources": sources
        }
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate answer. An unexpected server error occurred.")

@app.post("/api/chat")
async def chat_stream(req: ChatRequest, stream: bool = False, _=Depends(verify_api_key)):
    """
    Streaming conversation endpoint using Server-Sent Events (SSE).
    All events use a consistent JSON envelope: {type: string, data: any}
    Event types:
      - 'sources': Retrieved document sources (sent once at start)
      - 'token':   A text chunk of the answer
      - 'done':    Stream completed successfully
      - 'error':   An error occurred
    """
    if not stream:
        # Fallback to standard chat if stream is false
        return await chat(req)

    logger.info(f"Received streaming chat request for conversation {req.conversation_id}: {req.message[:50]}...")
    
    # Check for emergency
    emergency_response = check_emergency(req.message)
    if emergency_response:
        async def emergency_generator():
            yield f"data: {json.dumps({'type': 'sources', 'data': []})}\n\n"
            yield f"data: {json.dumps({'type': 'token', 'data': emergency_response})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        return StreamingResponse(emergency_generator(), media_type="text/event-stream")
    
    async def event_generator():
        import re
        try:
            rag_chain = get_rag_chain()
            
            # Buffer to detect and strip <think>...</think> blocks from reasoning models
            think_buffer = ""
            inside_think = False
            
            # Use LangChain astream to generate chunks asynchronously
            async for chunk in rag_chain.astream({"input": req.message}):
                # 1. Send sources context first if present in the chunk
                if "context" in chunk:
                    sources = []
                    for doc in chunk["context"]:
                        title = os.path.basename(doc.metadata.get("source", "Unknown"))
                        page = int(doc.metadata.get("page", 0)) + 1
                        sources.append({
                            "title": title,
                            "page": page,
                            "snippet": doc.page_content
                        })
                    yield f"data: {json.dumps({'type': 'sources', 'data': sources})}\n\n"
                
                # 2. Send answer text chunks (filter out <think> blocks)
                if "answer" in chunk:
                    token = chunk["answer"]
                    if not token:
                        continue
                    
                    think_buffer += token
                    
                    # Check if we're entering or inside a <think> block
                    if '<think>' in think_buffer and '</think>' not in think_buffer:
                        inside_think = True
                        continue
                    
                    if inside_think:
                        if '</think>' in think_buffer:
                            # Think block just closed — strip it entirely and emit leftover
                            cleaned = re.sub(r'<think>.*?</think>', '', think_buffer, flags=re.DOTALL).strip()
                            inside_think = False
                            think_buffer = ""
                            if cleaned:
                                yield f"data: {json.dumps({'type': 'token', 'data': cleaned})}\n\n"
                        # Still inside think block, keep buffering
                        continue
                    
                    # Not inside think tags — emit the token normally
                    think_buffer = ""
                    yield f"data: {json.dumps({'type': 'token', 'data': token})}\n\n"
            
            # Flush any remaining buffer (edge case: think block never closed)
            if think_buffer.strip():
                cleaned = re.sub(r'<think>.*?</think>', '', think_buffer, flags=re.DOTALL).strip()
                if cleaned:
                    yield f"data: {json.dumps({'type': 'token', 'data': cleaned})}\n\n"
                    
            # 3. Stream completed
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Error during stream generation: {str(e)}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'data': 'An internal error occurred while generating the answer.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/upload_pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    Upload and index a PDF document dynamically.
    Stores the file in the Data directory, chunks it, embeds it, and upserts it to Pinecone.
    """
    logger.info(f"Received PDF upload request: {file.filename}")
    
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Only PDF files are allowed."
        )
        
    try:
        # Ensure data directory exists
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        file_path = settings.DATA_DIR / file.filename
        
        # Save the uploaded file to disk
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File saved successfully to {file_path}. Commencing indexing...")
        
        # Process and chunk the saved file
        documents = load_single_pdf(str(file_path))
        text_chunks = split_documents(documents)
        
        logger.info(f"Split document into {len(text_chunks)} chunks. Upserting to Pinecone...")
        
        # Upsert chunks into Pinecone vector database
        upsert_documents(text_chunks)
        
        logger.info(f"Indexing completed successfully for {file.filename}.")
        return {
            "message": f"File '{file.filename}' uploaded and indexed successfully into vector store."
        }
    except Exception as e:
        logger.error(f"Error in upload_pdf endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process and index PDF. Please verify the PDF format and try again.")

@app.get("/documents")
async def list_documents():
    """
    List all uploaded PDF documents in the Data directory.
    """
    try:
        settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
        pdf_files = []
        for file in settings.DATA_DIR.glob("*.pdf"):
            stat = file.stat()
            pdf_files.append({
                "name": file.name,
                "size": stat.st_size,
                "modified": stat.st_mtime
            })
        return pdf_files
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list documents. Internal server error.")

@app.delete("/documents/{filename}")
async def delete_document(filename: str):
    """
    Delete an uploaded PDF document from the Data directory and clean up its vector store indexes.
    """
    try:
        file_path = settings.DATA_DIR / filename
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # 1. Delete matching embeddings from Pinecone first
        try:
            vector_store = get_vector_store()
            source_path = str(file_path.resolve())
            vector_store.delete(filter={"source": source_path})
            logger.info(f"Deleted vector store embeddings for: {source_path}")
        except Exception as pe:
            logger.warning(f"Could not delete embeddings from Pinecone: {str(pe)}")

        # 2. Delete file from disk
        file_path.unlink()
        logger.info(f"Deleted PDF file: {filename}")
        
        return {"message": f"Document '{filename}' and its embeddings deleted successfully."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete document. Internal server error.")

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Medical Chatbot Generative AI Backend",
        "index_name": settings.PINECONE_INDEX_NAME
    }

@app.get("/debug/cors")
async def debug_cors():
    return {
        "raw_allowed_origins": settings.ALLOWED_ORIGINS,
        "parsed_allowed_origins": allowed_origins,
        "allow_credentials": allow_credentials
    }

@app.get("/debug/test-rag")
async def debug_test_rag(query: str = "Explain the difference between Type 1 and Type 2 diabetes."):
    import traceback
    try:
        # Check settings
        settings_info = {
            "has_groq_api_key": bool(settings.GROQ_API_KEY),
            "has_pinecone_api_key": bool(settings.PINECONE_API_KEY),
            "pinecone_index_name": settings.PINECONE_INDEX_NAME,
            "has_hf_api_key": bool(settings.HUGGINGFACE_API_KEY),
            "embeddings_model": settings.EMBEDDINGS_MODEL
        }
        
        # Test embeddings
        from src.vector_store import get_embeddings
        embeddings = get_embeddings()
        embeddings_class = embeddings.__class__.__name__
        
        # Test vector store
        from src.vector_store import get_vector_store
        vector_store = get_vector_store()
        
        # Test query embeddings
        query_vector = embeddings.embed_query(query)
        embeddings_status = f"Success (dim: {len(query_vector)})"
        
        # Test Pinecone query
        retriever = vector_store.as_retriever(search_kwargs={"k": 1})
        docs = retriever.invoke(query)
        pinecone_status = f"Success (retrieved {len(docs)} docs)"
        
        # Test chain
        from src.chain import get_rag_chain
        chain = get_rag_chain()
        res = chain.invoke({"input": query})
        
        return {
            "status": "success",
            "settings": settings_info,
            "embeddings_class": embeddings_class,
            "embeddings_status": embeddings_status,
            "pinecone_status": pinecone_status,
            "chain_result": {
                "answer_length": len(res.get("answer", "")),
                "sources_count": len(res.get("context", []))
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error_message": str(e),
            "stack_trace": traceback.format_exc()
        }


