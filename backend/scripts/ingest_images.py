#!/usr/bin/env python3
"""
Image Ingestion Script for Multimodal Search

This script processes JPG images from a directory, generates Voyage multimodal embeddings,
stores images in MongoDB GridFS, and creates image documents in the database.

Usage:
    python scripts/ingest_images.py --image-dir /path/to/images --mapping /path/to/mapping.json

Mapping JSON format (optional):
{
    "image_filename.jpg": {
        "chunk_ids": ["chunk_00123", "chunk_00124"],
        "page_number": 42,
        "caption": "Engine component diagram",
        "diagram_type": "mechanical",
        "breadcrumb_trail": "Engine > Components > Layout"
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
from app.db.repositories.images import ImageRepository
from app.models.images import ImageDocument
from app.models.chunks import ImageMetadata

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def load_mapping(mapping_path: Optional[str]) -> Dict[str, Dict]:
    """
    Load image metadata mapping from JSON file
    
    Args:
        mapping_path: Path to mapping JSON file
        
    Returns:
        Dictionary mapping filename to metadata
    """
    if not mapping_path or not os.path.exists(mapping_path):
        logger.warning("No mapping file provided or file not found. Using default metadata.")
        return {}
    
    try:
        with open(mapping_path, 'r') as f:
            mapping = json.load(f)
        logger.info(f"Loaded mapping for {len(mapping)} images")
        return mapping
    except Exception as e:
        logger.error(f"Error loading mapping file: {e}")
        return {}


def extract_metadata_from_filename(filename: str) -> Dict[str, any]:
    """
    Extract metadata from filename patterns
    
    Supports patterns like:
    - engine_diagram_page_42.jpg
    - electrical_system_p85.jpg
    - brake_assembly_042.jpg
    
    Args:
        filename: Image filename
        
    Returns:
        Dictionary with extracted metadata
    """
    metadata = {}
    
    # Remove extension
    name = filename.rsplit('.', 1)[0]
    
    # Try to extract page number
    parts = name.split('_')
    for part in parts:
        # Check for 'page' or 'p' prefix
        if part.startswith('page') or part.startswith('p'):
            try:
                page_num = int(part.replace('page', '').replace('p', ''))
                metadata['page_number'] = page_num
            except ValueError:
                pass
        # Check for pure number at end
        elif part.isdigit():
            metadata['page_number'] = int(part)
    
    # Try to extract diagram type
    diagram_keywords = {
        'engine': 'mechanical',
        'motor': 'mechanical',
        'brake': 'mechanical',
        'suspension': 'mechanical',
        'electrical': 'electrical',
        'wiring': 'electrical',
        'circuit': 'electrical',
        'diagram': 'diagram',
        'schematic': 'schematic'
    }
    
    for keyword, dtype in diagram_keywords.items():
        if keyword in name.lower():
            metadata['diagram_type'] = dtype
            break
    
    return metadata


def process_image(
    image_path: str,
    embedding_service: MultimodalEmbeddingService,
    gridfs_manager: GridFSManager,
    image_repo: ImageRepository,
    mapping_data: Dict[str, Dict],
    dry_run: bool = False
) -> Optional[str]:
    """
    Process a single image: generate embedding, store in GridFS, create document
    
    Args:
        image_path: Path to image file
        embedding_service: Multimodal embedding service
        gridfs_manager: GridFS manager
        image_repo: Image repository
        mapping_data: Metadata mapping
        dry_run: If True, don't actually insert into database
        
    Returns:
        Image ID if successful, None otherwise
    """
    try:
        filename = os.path.basename(image_path)
        logger.info(f"Processing image: {filename}")
        
        # Read image file
        with open(image_path, 'rb') as f:
            image_bytes = f.read()
        
        # Generate multimodal embedding
        logger.info("Generating multimodal embedding...")
        embedding = embedding_service.generate_image_embedding_sync(image_bytes)
        logger.info(f"Generated embedding with {len(embedding)} dimensions")
        
        # Get metadata from mapping or extract from filename
        if filename in mapping_data:
            meta = mapping_data[filename]
            logger.info(f"Using metadata from mapping for {filename}")
        else:
            meta = extract_metadata_from_filename(filename)
            logger.info(f"Extracted metadata from filename for {filename}")
        
        # Store image in GridFS
        logger.info("Storing image in GridFS...")
        gridfs_metadata = {
            'filename': filename,
            'content_type': 'image/jpeg',
            'associated_chunk_ids': meta.get('chunk_ids', []),
            'page_number': meta.get('page_number'),
            'caption': meta.get('caption'),
            'diagram_type': meta.get('diagram_type')
        }
        
        if not dry_run:
            gridfs_file_id = gridfs_manager.store_image_bytes(
                image_bytes,
                filename,
                gridfs_metadata
            )
            logger.info(f"Stored in GridFS with file_id: {gridfs_file_id}")
        else:
            gridfs_file_id = "dry_run_file_id"
            logger.info("[DRY RUN] Would store in GridFS")
        
        # Create ImageMetadata
        image_metadata = ImageMetadata(
            gridfs_file_id=gridfs_file_id,
            filename=filename,
            content_type='image/jpeg',
            associated_chunk_ids=meta.get('chunk_ids', []),
            page_number=meta.get('page_number'),
            caption=meta.get('caption'),
            diagram_type=meta.get('diagram_type')
        )
        
        # Generate unique image ID
        image_id = f"image_{filename.rsplit('.', 1)[0]}"
        
        # Create ImageDocument
        image_doc = ImageDocument(
            id=image_id,
            gridfs_file_id=gridfs_file_id,
            multimodal_embedding=embedding,
            metadata=image_metadata,
            associated_chunk_ids=meta.get('chunk_ids', []),
            breadcrumb_trail=meta.get('breadcrumb_trail'),
            page_number=meta.get('page_number')
        )
        
        # Insert into database
        if not dry_run:
            image_repo.insert_image(image_doc)
            logger.info(f"✓ Successfully processed and stored image: {image_id}")
        else:
            logger.info(f"[DRY RUN] Would insert image document: {image_id}")
        
        return image_id
        
    except Exception as e:
        logger.error(f"Error processing image {image_path}: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Main ingestion function"""
    parser = argparse.ArgumentParser(description='Ingest images for multimodal search')
    parser.add_argument(
        '--image-dir',
        required=True,
        help='Directory containing JPG images'
    )
    parser.add_argument(
        '--mapping',
        help='Path to JSON file with image metadata mapping (optional)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without actually inserting into database'
    )
    parser.add_argument(
        '--limit',
        type=int,
        help='Limit number of images to process (for testing)'
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
        image_repo = ImageRepository()
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        sys.exit(1)
    
    # Load metadata mapping
    mapping_data = load_mapping(args.mapping)
    
    # Find all JPG images
    image_dir = Path(args.image_dir)
    image_files = list(image_dir.glob('*.jpg')) + list(image_dir.glob('*.jpeg')) + list(image_dir.glob('*.JPG'))
    
    if not image_files:
        logger.error(f"No JPG images found in {args.image_dir}")
        sys.exit(1)
    
    logger.info(f"Found {len(image_files)} images to process")
    
    # Apply limit if specified
    if args.limit:
        image_files = image_files[:args.limit]
        logger.info(f"Limited to {len(image_files)} images")
    
    if args.dry_run:
        logger.info("=== DRY RUN MODE - No changes will be made ===")
    
    # Process each image
    success_count = 0
    error_count = 0
    
    for idx, image_path in enumerate(image_files, 1):
        logger.info(f"\n[{idx}/{len(image_files)}] Processing: {image_path.name}")
        
        result = process_image(
            str(image_path),
            embedding_service,
            gridfs_manager,
            image_repo,
            mapping_data,
            dry_run=args.dry_run
        )
        
        if result:
            success_count += 1
        else:
            error_count += 1
    
    # Print summary
    logger.info("\n" + "="*60)
    logger.info("INGESTION SUMMARY")
    logger.info("="*60)
    logger.info(f"Total images processed: {len(image_files)}")
    logger.info(f"Successful: {success_count}")
    logger.info(f"Errors: {error_count}")
    
    if args.dry_run:
        logger.info("\nThis was a DRY RUN - no changes were made to the database")
    else:
        logger.info(f"\nImages stored in collection: {settings.IMAGES_COLLECTION}")
        logger.info(f"GridFS bucket: {settings.GRIDFS_BUCKET_NAME}")
    
    logger.info("="*60)


if __name__ == '__main__':
    main()

