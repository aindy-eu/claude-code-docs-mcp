#!/usr/bin/env python3
"""
Claude CLI Extraction Script

Calls the Claude CLI with proper environment isolation to extract
structured documentation data.

Usage:
    python extract.py <content_path> <prompt_path> <model>

Environment:
    DOC_URL: The documentation URL being processed

Example:
    DOC_URL="https://docs.example.com" python extract.py content.html prompt.md claude-sonnet-4
"""

import json
import os
import subprocess
import sys
import time
from pathlib import Path

# Import our modules
from lib.logger import log_error, log_success
from lib.claude_client import call_claude, is_claude_available
from lib.json_utils import parse_and_validate


def read_file(path: str, file_type: str) -> str:
    """
    Read a file with error handling

    Args:
        path: File path to read
        file_type: Type description for error messages

    Returns:
        File contents

    Raises:
        SystemExit: If file cannot be read
    """
    try:
        return Path(path).read_text(encoding='utf-8')
    except FileNotFoundError:
        print(f"[PYTHON] Error: {file_type} file not found: {path}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"[PYTHON] Error reading {file_type} file: {e}", file=sys.stderr)
        sys.exit(1)


def extract_with_claude(
    content_path: str,
    prompt_path: str,
    model: str
) -> dict:
    """
    Main extraction logic

    Args:
        content_path: Path to HTML content file
        prompt_path: Path to extraction prompt
        model: Claude model name

    Returns:
        Extracted and validated JSON data

    Raises:
        SystemExit: On any error
    """
    doc_url = os.environ.get('DOC_URL', 'unknown')
    start_time = time.time()

    # Check if Claude CLI is available
    if not is_claude_available():
        print("[PYTHON] Error: 'claude' command not found. Is Claude Code installed?", file=sys.stderr)
        log_error(
            doc_url, 'Claude CLI not found',
            model=model,
            error="'claude' command not in PATH",
            duration_ms=0
        )
        sys.exit(1)

    # Read prompt only - pass file path to Claude
    prompt = read_file(prompt_path, 'Prompt')

    # Prepare full prompt with file path
    # Claude will use its Read tool to access the file
    full_prompt = (
        f"{prompt}\n\n"
        f"URL: {doc_url}\n\n"
        f"Please read and extract from this HTML file:\n"
        f"{content_path}\n\n"
        f"Use the Read tool to access the file content."
    )

    # Call Claude CLI
    print(f"[PYTHON] Calling Claude CLI (model: {model})...", file=sys.stderr)

    try:
        result = call_claude(full_prompt, model)

        duration_ms = int((time.time() - start_time) * 1000)
        duration_s = round(duration_ms / 1000, 1)
        print(f"[PYTHON] Claude extraction took {duration_s}s", file=sys.stderr)

        # Check for errors
        if result.returncode != 0:
            error_msg = f"Claude CLI failed with exit code {result.returncode}"
            print(f"[PYTHON] Error: {error_msg}", file=sys.stderr)
            print(f"[PYTHON] stderr: {result.stderr}", file=sys.stderr)

            log_error(
                doc_url, 'Claude CLI failed',
                model=model,
                error=error_msg,
                stderr=result.stderr[:1000],
                raw_response=result.stdout[:10000] if result.stdout else None,
                duration_ms=duration_ms
            )
            sys.exit(1)

        # Check for empty response
        if not result.stdout.strip():
            error_msg = "Empty response from Claude"
            print(f"[PYTHON] Error: {error_msg}", file=sys.stderr)

            log_error(
                doc_url, 'Empty Claude response',
                model=model,
                error=error_msg,
                duration_ms=duration_ms
            )
            sys.exit(1)

        # Parse and validate JSON
        try:
            parsed = parse_and_validate(result.stdout)
        except json.JSONDecodeError as e:
            error_msg = f"Invalid JSON in response: {e}"
            print(f"[PYTHON] Error: {error_msg}", file=sys.stderr)
            print(f"[PYTHON] First 500 chars of response:", file=sys.stderr)
            print(result.stdout[:500], file=sys.stderr)

            log_error(
                doc_url, 'JSON parsing failed',
                model=model,
                error=error_msg,
                raw_response=result.stdout[:10000],
                duration_ms=duration_ms
            )
            sys.exit(1)
        except ValueError as e:
            error_msg = f"JSON validation failed: {e}"
            print(f"[PYTHON] Error: {error_msg}", file=sys.stderr)

            log_error(
                doc_url, 'JSON validation failed',
                model=model,
                error=error_msg,
                raw_response=result.stdout[:10000],
                duration_ms=duration_ms
            )
            sys.exit(1)

        # Success - log and print
        section_count = len(parsed.get('sections', []))
        code_count = sum(
            len(section.get('codeExamples', []))
            for section in parsed.get('sections', [])
        )

        log_success(
            doc_url, 'Extraction successful',
            model=model,
            duration_ms=duration_ms,
            section_count=section_count,
            code_example_count=code_count
        )

        # Print pretty JSON to stdout (for TypeScript to capture)
        print(json.dumps(parsed, indent=2))
        return parsed

    except subprocess.TimeoutExpired:
        duration_ms = int((time.time() - start_time) * 1000)
        error_msg = "Claude extraction timed out after 300s"
        print(f"[PYTHON] Error: {error_msg}", file=sys.stderr)

        log_error(
            doc_url, 'Extraction timeout',
            model=model,
            error=error_msg,
            duration_ms=duration_ms
        )
        sys.exit(1)

    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        error_msg = f"Unexpected error: {e}"
        print(f"[PYTHON] {error_msg}", file=sys.stderr)

        log_error(
            doc_url, 'Unexpected error',
            model=model,
            error=str(e),
            duration_ms=duration_ms
        )
        sys.exit(1)


if __name__ == '__main__':
    if len(sys.argv) < 4:
        print("Usage: extract.py <content_path> <prompt_path> <model>", file=sys.stderr)
        print("", file=sys.stderr)
        print("Example:", file=sys.stderr)
        print("  DOC_URL='https://...' python extract.py content.html prompt.md claude-sonnet-4", file=sys.stderr)
        sys.exit(1)

    content_path = sys.argv[1]
    prompt_path = sys.argv[2]
    model = sys.argv[3]

    extract_with_claude(content_path, prompt_path, model)
