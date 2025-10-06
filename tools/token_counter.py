#!/usr/bin/env python3
"""
Token Counter Script
Counts tokens in files and updates YAML frontmatter with token estimates.
"""

import os
import re
import yaml
from datetime import datetime
from pathlib import Path
import argparse

# Define excluded file extensions
EXCLUDED_EXTENSIONS = [
    ".DS_Store",
    ".png",
    ".jpg",
    ".jpeg",
    ".keep",
    ".pdf",
    ".docx",
    ".xlsx",
    ".zip",
    ".tar",
    ".gz"
]

def estimate_tokens(text):
    """
    Rough token estimation using word count.
    Generally, 1 token ≈ 0.75 words for English text.
    This gives us a conservative estimate.
    """
    # Remove extra whitespace and split into words
    words = len(text.split())
    # Conservative estimate: 1 token per word (slightly overestimating)
    return words

def extract_frontmatter(content):
    """
    Extract YAML frontmatter from markdown content.
    Returns (frontmatter_dict, content_without_frontmatter, has_frontmatter)
    """
    if not content.startswith('---\n'):
        return {}, content, False
    
    # Find the end of frontmatter
    end_match = re.search(r'\n---\n', content[4:])
    if not end_match:
        return {}, content, False
    
    frontmatter_end = end_match.start() + 4
    frontmatter_yaml = content[4:frontmatter_end]
    remaining_content = content[frontmatter_end + 4:]
    
    try:
        frontmatter = yaml.safe_load(frontmatter_yaml)
        return frontmatter or {}, remaining_content, True
    except yaml.YAMLError:
        return {}, content, False

def create_frontmatter(frontmatter_dict, token_count):
    """
    Create or update frontmatter with token count and timestamp.
    """
    frontmatter_dict['token_estimate'] = token_count
    frontmatter_dict['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    return frontmatter_dict

def process_file(file_path, add_frontmatter=False):
    """
    Process a single file: count tokens and optionally update frontmatter.
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        print(f"⚠️  Skipping {file_path} (binary file)")
        return None
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")
        return None

    # Extract frontmatter
    frontmatter, main_content, has_frontmatter = extract_frontmatter(content)

    # Count tokens in the main content (excluding frontmatter)
    token_count = estimate_tokens(main_content)

    if add_frontmatter:
        # Update frontmatter
        updated_frontmatter = create_frontmatter(frontmatter, token_count)

        # Reconstruct file content
        frontmatter_yaml = yaml.dump(updated_frontmatter, default_flow_style=False, sort_keys=False)
        new_content = f"---\n{frontmatter_yaml}---\n{main_content}"

        # Write back to file
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)

            status = "updated" if has_frontmatter else "added"
            print(f"✅ {file_path}: {token_count} tokens (frontmatter {status})")
            return token_count
        except Exception as e:
            print(f"❌ Error writing {file_path}: {e}")
            return None
    else:
        # Just display the count without modifying the file
        print(f"- {file_path}: {token_count} tokens")
        return token_count

def should_process_file(file_path):
    """
    Check if file should be processed based on extension.
    """
    file_extension = Path(file_path).suffix.lower()
    return file_extension not in EXCLUDED_EXTENSIONS

def process_directory(directory_path, recursive=True, add_frontmatter=False):
    """
    Process all eligible files in a directory.
    """
    directory = Path(directory_path)
    if not directory.exists():
        print(f"❌ Directory {directory_path} does not exist")
        return

    total_tokens = 0
    processed_files = 0

    pattern = "**/*" if recursive else "*"

    for file_path in directory.glob(pattern):
        if file_path.is_file() and should_process_file(file_path):
            tokens = process_file(file_path, add_frontmatter)
            if tokens is not None:
                total_tokens += tokens
                processed_files += 1

    print(f"\n📊 Summary:")
    print(f"   Processed files: {processed_files}")
    print(f"   Total tokens: {total_tokens:,}")

def main():
    parser = argparse.ArgumentParser(description='Count tokens in files and update YAML frontmatter')
    parser.add_argument('path', help='File or directory path to process')
    parser.add_argument('--no-recursive', action='store_true',
                       help='Don\'t process subdirectories (only for directory input)')
    parser.add_argument('--add-frontmatter', action='store_true',
                       help='Add YAML frontmatter to files (default: false)')

    args = parser.parse_args()

    path = Path(args.path)

    if path.is_file():
        if should_process_file(path):
            process_file(path, args.add_frontmatter)
        else:
            print(f"⚠️  Skipping {path} (excluded extension)")
    elif path.is_dir():
        process_directory(path, recursive=not args.no_recursive, add_frontmatter=args.add_frontmatter)
    else:
        print(f"❌ Path {args.path} does not exist")

if __name__ == "__main__":
    main() 