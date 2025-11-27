#!/usr/bin/env python3
"""
Delete chunks with numeric-only headings like "1.", "2.", "3." etc.

Usage:
    python delete_numeric_headings.py --dry-run  # Preview what will be deleted
    python delete_numeric_headings.py            # Actually delete
"""

import os
import sys
import re
import argparse
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
load_dotenv()

def is_numeric_heading(heading: str) -> bool:
    """
    Check if a heading is just a number (with optional punctuation)

    Examples that match:
        "1.", "2.", "3", "10.", "1", "25"

    Examples that don't match:
        "Section 1", "1. Introduction", "Chapter 1", None, ""
    """
    if not heading or not isinstance(heading, str):
        return False

    # Strip whitespace
    heading = heading.strip()

    # Match patterns like: "1", "1.", "2.", "10", "123."
    # Only digits optionally followed by a single period
    pattern = r'^\d+\.?$'

    return bool(re.match(pattern, heading))


def find_chunks_with_numeric_headings(collection):
    """Find all chunks with numeric-only headings"""

    # Find chunks where any heading level is just a number
    query = {
        "$or": [
            {"heading_level_1": {"$regex": r"^\d+\.?$"}},
            {"heading_level_2": {"$regex": r"^\d+\.?$"}},
            {"heading_level_3": {"$regex": r"^\d+\.?$"}}
        ]
    }

    chunks = list(collection.find(query))

    return chunks


def preview_deletions(chunks):
    """Show what will be deleted"""
    print(f"\n{'='*80}")
    print(f"Found {len(chunks)} chunks with numeric headings")
    print(f"{'='*80}\n")

    if len(chunks) == 0:
        print("No chunks to delete.")
        return

    # Group by heading patterns
    by_heading_1 = {}
    by_heading_2 = {}
    by_heading_3 = {}

    for chunk in chunks:
        h1 = chunk.get('heading_level_1')
        h2 = chunk.get('heading_level_2')
        h3 = chunk.get('heading_level_3')

        if h1 and is_numeric_heading(h1):
            by_heading_1[h1] = by_heading_1.get(h1, 0) + 1
        if h2 and is_numeric_heading(h2):
            by_heading_2[h2] = by_heading_2.get(h2, 0) + 1
        if h3 and is_numeric_heading(h3):
            by_heading_3[h3] = by_heading_3.get(h3, 0) + 1

    if by_heading_1:
        print("Chunks with numeric heading_level_1:")
        for heading, count in sorted(by_heading_1.items(), key=lambda x: int(x[0].rstrip('.'))):
            print(f"  - '{heading}': {count} chunks")
        print()

    if by_heading_2:
        print("Chunks with numeric heading_level_2:")
        for heading, count in sorted(by_heading_2.items(), key=lambda x: int(x[0].rstrip('.'))):
            print(f"  - '{heading}': {count} chunks")
        print()

    if by_heading_3:
        print("Chunks with numeric heading_level_3:")
        for heading, count in sorted(by_heading_3.items(), key=lambda x: int(x[0].rstrip('.'))):
            print(f"  - '{heading}': {count} chunks")
        print()

    # Show sample chunks
    print("Sample chunks that will be deleted:")
    print(f"{'-'*80}")
    for i, chunk in enumerate(chunks[:5]):
        print(f"\n{i+1}. Chunk ID: {chunk.get('id', 'N/A')}")
        print(f"   Heading 1: {chunk.get('heading_level_1', 'None')}")
        print(f"   Heading 2: {chunk.get('heading_level_2', 'None')}")
        print(f"   Heading 3: {chunk.get('heading_level_3', 'None')}")
        print(f"   Breadcrumb: {chunk.get('breadcrumb_trail', 'None')}")
        text_preview = chunk.get('text', '')[:100]
        print(f"   Text: {text_preview}{'...' if len(chunk.get('text', '')) > 100 else ''}")

    if len(chunks) > 5:
        print(f"\n... and {len(chunks) - 5} more chunks")
    print(f"\n{'-'*80}")


def delete_chunks(collection, chunks, dry_run=True):
    """Delete the chunks"""

    if len(chunks) == 0:
        print("No chunks to delete.")
        return

    chunk_ids = [chunk.get('id') for chunk in chunks if chunk.get('id')]

    if dry_run:
        print(f"\n🔍 DRY RUN MODE - No chunks will be deleted")
        print(f"Would delete {len(chunk_ids)} chunks")
        return

    # Confirm deletion
    print(f"\n⚠️  WARNING: About to delete {len(chunk_ids)} chunks permanently!")
    response = input("Type 'DELETE' to confirm: ")

    if response != 'DELETE':
        print("Deletion cancelled.")
        return

    # Perform deletion
    result = collection.delete_many({"id": {"$in": chunk_ids}})

    print(f"\n✅ Deleted {result.deleted_count} chunks")


def main():
    parser = argparse.ArgumentParser(
        description="Delete chunks with numeric-only headings"
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview what will be deleted without actually deleting'
    )

    args = parser.parse_args()

    # Get MongoDB connection details
    mongodb_uri = os.getenv('MONGODB_URI')
    database_name = os.getenv('DATABASE_NAME') or os.getenv('MONGODB_DATABASE_NAME')
    collection_name = os.getenv('CHUNKS_COLLECTION') or os.getenv('COLLECTION_NAME')

    if not mongodb_uri:
        print("❌ Error: MONGODB_URI not found in environment variables")
        sys.exit(1)

    if not database_name:
        print("❌ Error: DATABASE_NAME not found in environment variables")
        sys.exit(1)

    if not collection_name:
        print("❌ Error: CHUNKS_COLLECTION not found in environment variables")
        sys.exit(1)

    print(f"Connecting to MongoDB...")
    print(f"  Database: {database_name}")
    print(f"  Collection: {collection_name}")

    # Connect to MongoDB
    client = MongoClient(mongodb_uri)
    db = client[database_name]
    collection = db[collection_name]

    # Find chunks with numeric headings
    print("\nSearching for chunks with numeric headings...")
    chunks = find_chunks_with_numeric_headings(collection)

    # Preview what will be deleted
    preview_deletions(chunks)

    # Delete (or dry run)
    delete_chunks(collection, chunks, dry_run=args.dry_run)

    if args.dry_run:
        print("\nTo actually delete these chunks, run without --dry-run flag:")
        print("  python delete_numeric_headings.py")

    # Close connection
    client.close()


if __name__ == "__main__":
    main()
