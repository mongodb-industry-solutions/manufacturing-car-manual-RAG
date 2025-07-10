from typing import List, Dict, Any, Optional
import json
import logging
import os
from google.cloud import aiplatform
from google.oauth2 import service_account
from vertexai.preview.generative_models import GenerativeModel, ChatSession

from app.core.config import get_settings
from app.models.chunks import Chunk

logger = logging.getLogger(__name__)

class RAGService:
    """Service for generating answers using RAG with Google Vertex AI Gemini models"""
    
    def __init__(self):
        """Initialize the RAG service with Vertex AI configuration"""
        self.settings = get_settings()
        self.model_id = self.settings.CHATCOMPLETIONS_MODEL_ID
        self._initialize_client()
        self.model = GenerativeModel(self.model_id)
        logger.info(f"Initialized Vertex AI generative model: {self.model_id}")
    
    def _initialize_client(self):
        """Initialize the Vertex AI client"""
        try:
            # Check if service account key file exists in environment variable
            credentials = None
            if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
                credentials = service_account.Credentials.from_service_account_file(
                    os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
                )
            
            # Initialize Vertex AI client
            aiplatform.init(
                project=self.settings.GCP_PROJECT_ID,
                location=self.settings.GCP_LOCATION,
                credentials=credentials
            )
            
            logger.info(f"Successfully initialized Vertex AI client for project {self.settings.GCP_PROJECT_ID}")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI client: {e}")
            raise
    
    def _format_rag_context(self, chunks: List[Chunk]) -> str:
        """Format chunks into a context string for RAG"""
        context_parts = []
        
        for i, chunk in enumerate(chunks):
            # Format navigation info
            nav_info = []
            if chunk.breadcrumb_trail:
                nav_info.append(f"Path: {chunk.breadcrumb_trail}")
            if chunk.heading_level_1:
                nav_info.append(f"Section: {chunk.heading_level_1}")
            if chunk.heading_level_2:
                nav_info.append(f"Subsection: {chunk.heading_level_2}")
            if chunk.heading_level_3:
                nav_info.append(f"Topic: {chunk.heading_level_3}")
            
            # Format safety notices if any
            safety_notices = ""
            if chunk.safety_notices and len(chunk.safety_notices) > 0:
                safety_parts = []
                for notice in chunk.safety_notices:
                    safety_parts.append(f"{notice.type}: {notice.content}")
                safety_notices = "\n".join(["SAFETY NOTICES:"] + safety_parts) + "\n"
            
            # Format procedural steps if any
            procedural_steps = ""
            if chunk.procedural_steps and len(chunk.procedural_steps) > 0:
                steps_parts = []
                for step in chunk.procedural_steps:
                    steps_parts.append(f"{step.marker}. {step.instruction}")
                procedural_steps = "\n".join(["PROCEDURE:"] + steps_parts) + "\n"
            
            # Combine all parts
            chunk_context = f"CHUNK {i+1} [{', '.join(nav_info)}]\n"
            if safety_notices:
                chunk_context += safety_notices
            if procedural_steps:
                chunk_context += procedural_steps
            chunk_context += f"CONTENT:\n{chunk.text}\n"
            
            context_parts.append(chunk_context)
        
        return "\n\n".join(context_parts)
    
    async def generate_answer(self, query: str, chunks: List[Chunk], temperature: float = 0.2) -> str:
        """Generate an answer to the query using RAG with Gemini"""
        try:
            # Format context from chunks
            context = self._format_rag_context(chunks)
            
            # Create a chat session
            chat = self.model.start_chat(
                temperature=temperature,
                top_k=40,
                top_p=0.95,
            )
            
            # Create a system prompt
            system_prompt = (
                "You are an automotive expert assistant that helps users understand their car manual. "
                "Answer the user's question using ONLY the provided context from the car manual. "
                "If the information is not in the context, say 'I don't have information about that in the car manual.' "
                "Keep your answers concise, technical but easy to understand, and safety-focused. "
                "If there are safety warnings in the context, emphasize them in your answer."
            )
            
            # Set the system prompt
            chat.send_message(system_prompt, role="system")
            
            # Format user prompt with context
            user_prompt = f"I have a question about my car: {query}\n\nHere is information from the car manual:\n\n{context}"
            
            # Get response
            response = chat.send_message(user_prompt)
            answer = response.text
            
            logger.info(f"Successfully generated RAG answer")
            return answer
        except Exception as e:
            logger.error(f"Failed to generate answer: {e}")
            raise