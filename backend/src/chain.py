from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from src.config import settings
from src.vector_store import get_vector_store

def get_rag_chain():
    """
    Constructs and returns the RAG retrieval chain using Groq LLM and Pinecone vector store retriever.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("Groq_API_KEY is not set in the environment or .env file.")

    # Initialize Groq Chat LLM with streaming enabled
    # We use llama-3.3-70b-versatile which is the standard, active model on Groq.
    llm = ChatGroq(
        groq_api_key=settings.GROQ_API_KEY,
        model_name="llama-3.3-70b-versatile",
        temperature=0.3,
        max_tokens=1024,
        streaming=True,
    )

    # Initialize the retriever
    vector_store = get_vector_store()
    retriever = vector_store.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 3}
    )

    system_prompt = (
        "You are Medibot, a helpful and friendly medical knowledge assistant. "
        "You must ONLY answer questions related to medicine, health, diseases, symptoms, healthcare, treatments, or medical knowledge. "
        "If the user's question is NOT related to medical, clinical, or health-related topics (such as general knowledge, politics, geography, jokes, or personal chat), "
        "you must ignore the context and respond with a polite message stating that you can only answer medical-related queries. "
        "For valid medical queries, look at the retrieved context from the uploaded documents. "
        "If the query asks about details or definitions 'in the document' (or references the document) but the retrieved context does not contain this information (for example, if the uploaded document is a resume or lacks the relevant medical details), you must explicitly state that the provided document does not contain this information. "
        "However, you must still provide a helpful answer to the user's medical query using your own general medical knowledge, explaining the medical terms/concepts clearly (e.g. 'I couldn't find any mention of [concept] in the provided document. However, in general medical knowledge, [concept] is...'). "
        "Keep your answer clear and well-structured. "
        "Use bullet points or numbered lists when listing multiple items. "
        "Use markdown bold for key terms. "
        "Respond directly with your answer. Provide a helpful, clean response.\n\n"
        "EMERGENCY PROTOCOL: If the user's query describes a critical or life-threatening medical emergency (such as a heart attack, severe bleeding, stroke, chest pain, difficulty breathing, poisoning, choking, major head injury, or unconsciousness), you MUST prioritize safety above all else. Your response MUST begin by clearly and prominently instructing the user to call an ambulance (emergency services) and consult a nearby doctor immediately. For example: '**EMERGENCY ALERT: Please call an ambulance and consult a nearby doctor immediately.**' Only after this prominent warning may you provide extremely brief, safe first-aid steps if applicable. Do not delay or bury this warning, and do not provide complex treatment procedures.\n\n"
        "{context}"
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])

    # Build the document stuffed chain and RAG pipeline
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)

    return rag_chain

