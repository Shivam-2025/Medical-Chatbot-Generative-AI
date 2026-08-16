import os
from typing import List
from langchain_core.documents import Document
from src.config import settings

# Graceful HuggingFaceEmbeddings import fallbacks
try:
    from langchain_community.embeddings import HuggingFaceEmbeddings
except ImportError:
    try:
        from langchain.embeddings import HuggingFaceEmbeddings
    except ImportError:
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
        except ImportError:
            raise ImportError(
                "Could not import HuggingFaceEmbeddings. "
                "Please make sure sentence-transformers or langchain-community is installed."
            )

# Graceful PineconeVectorStore import
try:
    import sys
    from types import ModuleType
    import multiprocessing.pool
    import pinecone
    
    # Retrieve base classes from pinecone
    _Index = getattr(pinecone, 'Index', None)
    if not _Index:
        try:
            from pinecone.index import Index as _Index
        except ImportError:
            pass

    _IndexAsyncio = getattr(pinecone, 'AsyncIndex', None)
    if not _IndexAsyncio:
        try:
            from pinecone.async_client.async_index import AsyncIndex as _IndexAsyncio
        except ImportError:
            pass

    embeddings_list_cls = getattr(pinecone, 'EmbeddingsList', None)
    if not embeddings_list_cls:
        try:
            from pinecone.models.inference.embed import EmbeddingsList as embeddings_list_cls
        except ImportError:
            pass
            
    # Mock pinecone.data and its submodules for langchain-pinecone compatibility
    p_data = ModuleType('pinecone.data')
    sys.modules['pinecone.data'] = p_data
    pinecone.data = p_data
    p_data._Index = _Index
    p_data._IndexAsyncio = _IndexAsyncio
    
    p_data_index = ModuleType('pinecone.data.index')
    sys.modules['pinecone.data.index'] = p_data_index
    p_data.index = p_data_index
    p_data_index.ApplyResult = multiprocessing.pool.ApplyResult
    
    p_features = ModuleType('pinecone.data.features')
    sys.modules['pinecone.data.features'] = p_features
    p_data.features = p_features
    
    p_inference = ModuleType('pinecone.data.features.inference')
    sys.modules['pinecone.data.features.inference'] = p_inference
    p_features.inference = p_inference
    
    p_inference_mod = ModuleType('pinecone.data.features.inference.inference')
    sys.modules['pinecone.data.features.inference.inference'] = p_inference_mod
    p_inference.inference = p_inference_mod
    
    if embeddings_list_cls:
        p_inference_mod.EmbeddingsList = embeddings_list_cls

    from langchain_pinecone import PineconeVectorStore
except ImportError as e:
    raise ImportError(
        f"Could not import PineconeVectorStore: {e}. "
        "Please run 'pip install langchain-pinecone'."
    )

from langchain_core.embeddings import Embeddings

class HuggingFaceAPIEmbeddings(Embeddings):
    """
    Generate embeddings using Hugging Face's Serverless Inference API.
    Bypasses the need to load PyTorch or sentence-transformers locally,
    fitting within constrained memory limits (like Render's free tier).
    """
    def __init__(self, model_name: str, hf_api_token: str):
        self.model_name = model_name
        self.hf_api_token = hf_api_token
        self.api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_name}"
        self.headers = {"Authorization": f"Bearer {hf_api_token}"}

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        import requests
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json={"inputs": texts, "options": {"wait_for_model": True}}
        )
        if response.status_code != 200:
            raise ValueError(f"HF API returned status {response.status_code}: {response.text}")
        return response.json()

    def embed_query(self, text: str) -> List[float]:
        import requests
        response = requests.post(
            self.api_url,
            headers=self.headers,
            json={"inputs": [text], "options": {"wait_for_model": True}}
        )
        if response.status_code != 200:
            raise ValueError(f"HF API returned status {response.status_code}: {response.text}")
        return response.json()[0]

def get_embeddings() -> Embeddings:
    """
    Returns the Hugging Face embeddings service.
    Uses Hugging Face Serverless API if an API key is present in configuration (saves memory),
    otherwise falls back to loading sentence-transformers locally via PyTorch.
    """
    if settings.HUGGINGFACE_API_KEY:
        return HuggingFaceAPIEmbeddings(
            model_name=settings.EMBEDDINGS_MODEL,
            hf_api_token=settings.HUGGINGFACE_API_KEY
        )
    else:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        embeddings = HuggingFaceEmbeddings(model_name=settings.EMBEDDINGS_MODEL)
        return embeddings

def get_vector_store() -> PineconeVectorStore:
    """
    Connect to the existing Pinecone index and return the vector store retriever.
    """
    # Ensure credentials are set
    if not settings.PINECONE_API_KEY:
        raise ValueError("PINECONE_API_KEY is not set in the environment or .env file.")
    
    os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
    
    embeddings = get_embeddings()
    
    # Directly create the Pinecone Index object using the v9 SDK
    # This bypasses langchain-pinecone's from_existing_index() which is
    # broken with Pinecone SDK v9.x ('IndexList' has no attribute 'index_list')
    from pinecone import Pinecone
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
    
    # Pinecone SDK v9 uses `_config` internally, but langchain-pinecone v0.2.13
    # accesses `index.config.host`. Patch the index to expose `config` as a
    # public alias so PineconeVectorStore.__init__ can read the host.
    if not hasattr(pinecone_index, 'config') and hasattr(pinecone_index, '_config'):
        pinecone_index.__class__.config = property(lambda self: self._config)
    
    vector_store = PineconeVectorStore(
        index=pinecone_index,
        embedding=embeddings,
        text_key="text"
    )
    return vector_store

def upsert_documents(documents: List[Document]) -> PineconeVectorStore:
    """
    Embed and upsert a list of document chunks into the Pinecone index.
    """
    vector_store = get_vector_store()
    vector_store.add_documents(documents)
    return vector_store
