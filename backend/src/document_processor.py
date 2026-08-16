import os
from typing import List
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

try:
    from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
except ImportError:
    from langchain.document_loaders import PyPDFLoader, DirectoryLoader

def load_directory_pdf(data_dir: str) -> List[Document]:
    """
    Extract data from all PDF files inside the specified directory.
    """
    if not os.path.exists(data_dir):
        return []
    loader = DirectoryLoader(
        data_dir,
        glob="*.pdf",
        loader_cls=PyPDFLoader
    )
    documents = loader.load()
    return documents

def load_single_pdf(file_path: str) -> List[Document]:
    """
    Load text from a single PDF file.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")
    loader = PyPDFLoader(file_path)
    documents = loader.load()
    return documents

def split_documents(documents: List[Document], chunk_size: int = 500, chunk_overlap: int = 20) -> List[Document]:
    """
    Split document objects into text chunks.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    text_chunks = text_splitter.split_documents(documents)
    return text_chunks
