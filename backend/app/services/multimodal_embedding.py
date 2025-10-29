from typing import List
import logging
from io import BytesIO
import voyageai
from PIL import Image

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class MultimodalEmbeddingService:
    """Service for generating multimodal embeddings using Voyage AI"""

    def __init__(self):
        """Initialize the multimodal embedding service with Voyage AI configuration"""
        self.settings = get_settings()
        self.api_key = self.settings.VOYAGE_API_KEY
        self.model_id = self.settings.MULTIMODAL_MODEL_ID
        self.client = voyageai.Client(api_key=self.api_key)
        logger.info(f"Initialized Voyage AI multimodal embedding service with model: {self.model_id}")

    async def generate_image_embedding(self, image_bytes: bytes) -> List[float]:
        """
        Generate multimodal embedding for an image using Voyage AI

        Args:
            image_bytes: Raw image bytes (JPEG, PNG, etc.)

        Returns:
            List of floats representing the embedding (1024 dimensions)
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_bytes))

            # Use Voyage AI SDK
            result = self.client.multimodal_embed(
                inputs=[[image]],
                model=self.model_id,
                input_type="document"
            )

            # Extract embedding from response
            if result.embeddings and len(result.embeddings) > 0:
                embedding = result.embeddings[0]
                logger.info(f"Successfully generated image embedding with {len(embedding)} dimensions")
                return embedding

            raise ValueError("Empty embedding response from Voyage AI")

        except Exception as e:
            logger.error(f"Error generating image embedding: {e}")
            raise

    async def generate_text_embedding(self, text: str) -> List[float]:
        """
        Generate multimodal embedding for text using Voyage AI

        This is useful for text queries against multimodal embeddings.

        Args:
            text: Text string to embed

        Returns:
            List of floats representing the embedding (1024 dimensions)
        """
        try:
            # Use Voyage AI SDK
            result = self.client.multimodal_embed(
                inputs=[[text]],
                model=self.model_id,
                input_type="query"
            )

            # Extract embedding from response
            if result.embeddings and len(result.embeddings) > 0:
                embedding = result.embeddings[0]
                logger.info(f"Successfully generated text embedding with {len(embedding)} dimensions")
                return embedding

            raise ValueError("Empty embedding response from Voyage AI")

        except Exception as e:
            logger.error(f"Error generating text embedding: {e}")
            raise

    def generate_image_embedding_sync(self, image_bytes: bytes) -> List[float]:
        """
        Synchronous version of generate_image_embedding for use in scripts

        Args:
            image_bytes: Raw image bytes

        Returns:
            List of floats representing the embedding
        """
        try:
            # Convert bytes to PIL Image
            image = Image.open(BytesIO(image_bytes))

            # Use Voyage AI SDK
            result = self.client.multimodal_embed(
                inputs=[[image]],
                model=self.model_id,
                input_type="document"
            )

            # Extract embedding from response
            if result.embeddings and len(result.embeddings) > 0:
                embedding = result.embeddings[0]
                logger.info(f"Successfully generated image embedding with {len(embedding)} dimensions")
                return embedding

            raise ValueError("Empty embedding response from Voyage AI")

        except Exception as e:
            logger.error(f"Error generating image embedding: {e}")
            raise
