import os
from pathlib import Path

import numpy as np

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from your .env file."
    )

client = genai.Client(api_key=API_KEY, http_options={"timeout": 10000})

app = FastAPI(title="Agricultural RAG Chatbot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)


DOCUMENT_PATH = BASE_DIR / "documents" / "agriculture.txt"
# Model names can change depending on availability and account access.
EMBEDDING_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-3.1-flash-lite"


def load_documents():
    if not DOCUMENT_PATH.exists():
        raise FileNotFoundError(
            f"Document not found: {DOCUMENT_PATH}"
        )

    text = DOCUMENT_PATH.read_text(encoding="utf-8").strip()

    if not text:
        raise ValueError("agriculture.txt is empty.")

    chunks = [
        paragraph.strip()
        for paragraph in text.split("\n\n")
        if paragraph.strip()
    ]

    return chunks


documents = load_documents()


def create_embeddings(texts):
    embeddings = []
    print(f"DEBUG: Embedding {len(texts)} text(s)", flush=True)

    for text in texts:
        print("DEBUG: Starting embedding request", flush=True)
        result = client.models.embed_content(
            model=EMBEDDING_MODEL,
            contents=text,
        )

        print("DEBUG: Embedding request completed", flush=True)
        embeddings.append(result.embeddings[0].values)

    return np.array(embeddings)


# Create embeddings for the document chunks.
document_embeddings = create_embeddings(documents)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


@app.get("/")
def home():
    return {
        "message": "Gemini Agricultural RAG Chatbot is running!",
        "documents_loaded": len(documents),
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:
        # Convert the question into an embedding.
        query_embedding = create_embeddings([question])[0]

        # Find the most relevant document chunks.
        denominator = (
            np.linalg.norm(document_embeddings, axis=1)
            * np.linalg.norm(query_embedding)
        )

        similarities = (
            np.dot(document_embeddings, query_embedding)
            / np.maximum(denominator, 1e-10)
        )

        top_indices = np.argsort(similarities)[::-1][:3]

        context = "\n\n".join(
            documents[i] for i in top_indices
        )

        print("DEBUG: Starting answer generation", flush=True)
        # Generate an answer using Gemini.
        response = client.models.generate_content(
            model=CHAT_MODEL,
            contents=(
                "You are an agricultural assistant. Answer using the "
                "provided agricultural context. If the context does not "
                "contain enough information, say so. Do not invent facts. "
                "Use simple language.\n\n"
                f"Agricultural context:\n{context}\n\n"
                f"Farmer's question: {question}"
            ),
        )

        return ChatResponse(
            answer=response.text or "I couldn't generate an answer.",
            sources=[documents[i] for i in top_indices],
        )

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini request failed: {str(exc)}",
        )
