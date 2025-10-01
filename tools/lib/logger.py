"""
Pipeline logging in JSONL format
Provides structured logging for documentation ingestion pipeline
"""

import json
import sys
import time
from pathlib import Path
from typing import Any, Dict
from urllib.parse import urlparse


def get_log_file(url: str, stage: str = 'extract') -> Path:
    """
    Get log file path for the URL's domain

    Args:
        url: The documentation URL being processed
        stage: Pipeline stage (fetch, extract, embed)

    Returns:
        Path to the log file
    """
    parsed = urlparse(url)
    domain = parsed.hostname or 'unknown'

    # Match TypeScript structure: .data/{domain}/logs/{stage}.jsonl
    log_dir = Path.cwd() / '.data' / domain / 'logs'
    log_dir.mkdir(parents=True, exist_ok=True)

    return log_dir / f'{stage}.jsonl'


def log_entry(
    url: str,
    level: str,
    message: str,
    stage: str = 'extract',
    **kwargs: Any
) -> None:
    """
    Write a log entry in JSONL format

    Args:
        url: The documentation URL being processed
        level: Log level (info, error, warning)
        message: Log message
        stage: Pipeline stage (fetch, extract, embed)
        **kwargs: Additional fields to include in log entry
    """
    entry = {
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%S.000Z', time.gmtime()),
        'level': level,
        'stage': stage,
        'url': url,
        'message': message,
        **kwargs
    }

    try:
        log_file = get_log_file(url, stage)
        with open(log_file, 'a') as f:
            f.write(json.dumps(entry) + '\n')
    except Exception as e:
        print(f"[LOGGER] Warning: Failed to write log: {e}", file=sys.stderr)


def log_success(
    url: str,
    message: str,
    stage: str = 'extract',
    **kwargs: Any
) -> None:
    """Log a successful operation"""
    log_entry(url, 'info', message, stage, **kwargs)


def log_error(
    url: str,
    message: str,
    stage: str = 'extract',
    **kwargs: Any
) -> None:
    """Log an error"""
    log_entry(url, 'error', message, stage, **kwargs)


def log_warning(
    url: str,
    message: str,
    stage: str = 'extract',
    **kwargs: Any
) -> None:
    """Log a warning"""
    log_entry(url, 'warning', message, stage, **kwargs)
