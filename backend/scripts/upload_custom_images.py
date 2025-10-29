#!/usr/bin/env python3
"""
Custom Image Upload Script for Multimodal Search

This script uploads custom images to the manuals collection with rich metadata,
generates Voyage multimodal embeddings, and stores images in MongoDB GridFS.

Usage:
    python scripts/upload_custom_images.py --image-dir /path/to/images --metadata /path/to/metadata.json
    python scripts/upload_custom_images.py --image-dir /path/to/images --metadata /path/to/metadata.json --dry-run

Metadata JSON format:
{
    "image_filename.jpg": {
        "title": "Image Title",
        "description": "Detailed description",
        "keywords": ["keyword1", "keyword2"],
        "languages": ["English", "Spanish"],
        "category": "Category Name",
        "breadcrumb_trail": "Path > To > Content",
        "page_numbers": [15],
        "content_type": ["diagram", "reference"],
        "vehicle_systems": ["safety"],
        "associated_chunk_ids": []
    }
}
"""

import os
import sys
import json
import argparse
import logging
from pathlib import Path
from typing import Dict, List, Optional

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.config import get_settings
from app.services.multimodal_embedding import MultimodalEmbeddingService
from app.db.gridfs_manager import GridFSManager
from pymongo import MongoClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_metadata(metadata_path: str) -> Dict[str, Dict]:
    """
    Load image metadata from JSON file

    Args:
        metadata_path: Path to metadata JSON file

    Returns:
        Dictionary mapping filename to metadata
    """
    if not os.path.exists(metadata_path):
        logger.error(f"Metadata file not found: {metadata_path}")
        sys.exit(1)

    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        logger.info(f"Loaded metadata for {len(metadata)} images")
        return metadata
    except Exception as e:
        logger.error(f"Error loading metadata file: {e}")
        sys.exit(1)


def validate_metadata(filename: str, meta: Dict) -> bool:
    """
    Validate required metadata fields

    Args:
        filename: Image filename
        meta: Metadata dictionary

    Returns:
        True if valid, False otherwise
    """
    required_fields = ["title", "description"]

    for field in required_fields:
        if field not in meta or not meta[field]:
            logger.warning(f"Image {filename}: Missing required field '{field}'")
            return False

    return True


def process_image(
    image_path: str,
    metadata: Dict,
    embedding_service: MultimodalEmbeddingService,
    gridfs_manager: GridFSManager,
    collection,
    dry_run: bool = False
) -> Optional[str]:
    """
    Process a single image: generate embedding, store in GridFS, create document

    Args:
        image_path: Path to image file
        metadata: Metadata dictionary
        embedding_service: Multimodal embedding service
        gridfs_manager: GridFS manager
        collection: MongoDB collection
        dry_run: If True, don't actually insert into database

    Returns:
        Image ID if successful, None otherwise
    """
    try:
        filename = os.path.basename(image_path)
        logger.info(f"Processing image: {filename}")

        # Validate metadata
        if not validate_metadata(filename, metadata):
            logger.error(f"Invalid metadata for {filename}, skipping")
            return None

        # Read image file
        with open(image_path, 'rb') as f:
            image_bytes = f.read()

        # Generate multimodal embedding
        logger.info("  → Generating multimodal embedding...")
        embedding = embedding_service.generate_image_embedding_sync(image_bytes)
        logger.info(f"  → Generated embedding with {len(embedding)} dimensions")

        # Set content type to JPEG
        content_type = 'image/jpeg'

        # Store image in GridFS
        logger.info("  → Storing image in GridFS...")
        gridfs_metadata = {
            'filename': filename,
            'content_type': content_type,
            'title': metadata.get('title'),
            'description': metadata.get('description')
        }

        if not dry_run:
            # Store image in GridFS
            gridfs_file_id = gridfs_manager.store_image_bytes(
                image_bytes,
                filename,
                gridfs_metadata
            )
            logger.info(f"  → Stored in GridFS with file_id: {gridfs_file_id}")
        else:
            gridfs_file_id = "dry_run_file_id"
            logger.info("  → [DRY RUN] Would store in GridFS")

        # Generate unique image ID
        image_id = f"image_{filename.rsplit('.', 1)[0]}"

        # Create image document for manuals collection
        image_doc = {
            "id": image_id,
            "text": metadata.get('title'),  # Use title as searchable text
            "multimodal_embedding": embedding,
            "gridfs_file_id": gridfs_file_id,

            # Rich metadata
            "title": metadata.get('title'),
            "description": metadata.get('description'),
            "keywords": metadata.get('keywords', []),
            "languages": metadata.get('languages', []),
            "category": metadata.get('category'),

            # Optional fields
            "page_numbers": metadata.get('page_numbers', []),
            "breadcrumb_trail": metadata.get('breadcrumb_trail'),
            "content_type": metadata.get('content_type', []),
            "vehicle_systems": metadata.get('vehicle_systems', []),
            "associated_chunk_ids": metadata.get('associated_chunk_ids', [])
        }

        # Insert into database
        if not dry_run:
            collection.insert_one(image_doc)
            logger.info(f"  ✓ Successfully processed and stored image: {image_id}")
        else:
            logger.info(f"  ✓ [DRY RUN] Would insert image document: {image_id}")

        return image_id

    except Exception as e:
        logger.error(f"Error processing image {image_path}: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main upload function"""
    parser = argparse.ArgumentParser(description='Upload custom images for multimodal search')
    parser.add_argument(
        '--image-dir',
        required=True,
        help='Directory containing JPG images'
    )
    parser.add_argument(
        '--metadata',
        required=True,
        help='Path to JSON file with image metadata'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without actually inserting into database'
    )

    args = parser.parse_args()

    # Validate image directory
    if not os.path.isdir(args.image_dir):
        logger.error(f"Image directory not found: {args.image_dir}")
        sys.exit(1)

    # Load settings and initialize services
    logger.info("Initializing services...")
    try:
        settings = get_settings()
        embedding_service = MultimodalEmbeddingService()
        gridfs_manager = GridFSManager()

        # Connect to MongoDB manuals collection
        client = MongoClient(settings.MONGODB_URI)
        db = client[settings.DATABASE_NAME]
        collection = db[settings.CHUNKS_COLLECTION]  # Unified collection

        logger.info(f"Connected to collection: {settings.CHUNKS_COLLECTION}")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        sys.exit(1)

    # Load metadata
    metadata_dict = load_metadata(args.metadata)

    # Find all JPG image files
    image_dir = Path(args.image_dir)
    image_files = (
        list(image_dir.glob('*.jpg')) +
        list(image_dir.glob('*.jpeg')) +
        list(image_dir.glob('*.JPG')) +
        list(image_dir.glob('*.JPEG'))
    )

    if not image_files:
        logger.error(f"No JPG image files found in {args.image_dir}")
        sys.exit(1)

    logger.info(f"Found {len(image_files)} images to process")

    if args.dry_run:
        logger.info("=== DRY RUN MODE - No changes will be made ===")

    # Process each image
    success_count = 0
    error_count = 0
    skipped_count = 0

    for idx, image_path in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] Processing: {image_path.name}")

        # Check if metadata exists for this image
        if image_path.name not in metadata_dict:
            logger.warning(f"No metadata found for {image_path.name}, skipping")
            skipped_count += 1
            continue

        meta = metadata_dict[image_path.name]

        result = process_image(
            str(image_path),
            meta,
            embedding_service,
            gridfs_manager,
            collection,
            dry_run=args.dry_run
        )

        if result:
            success_count += 1
        else:
            error_count += 1

    # Print summary
    logger.info("\n" + "="*60)
    logger.info("UPLOAD SUMMARY")
    logger.info("="*60)
    logger.info(f"Total images found: {len(image_files)}")
    logger.info(f"Successful: {success_count}")
    logger.info(f"Errors: {error_count}")
    logger.info(f"Skipped (no metadata): {skipped_count}")

    if args.dry_run:
        logger.info("\nThis was a DRY RUN - no changes were made to the database")
    else:
        logger.info(f"\nImages stored in collection: {settings.CHUNKS_COLLECTION}")
        logger.info(f"GridFS bucket: {settings.GRIDFS_BUCKET_NAME}")
        logger.info("\nNext steps:")
        logger.info("1. Create MongoDB vector search index for multimodal_embedding (1024d)")
        logger.info("2. Test multimodal search via API: POST /api/v1/search/multimodal")

    logger.info("="*60)

    # Close connection
    client.close()


if __name__ == '__main__':
    main()
