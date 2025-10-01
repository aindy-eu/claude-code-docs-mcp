"""
JSON extraction and validation utilities
Handles Claude's potentially messy JSON output
"""

import json
from typing import Any, Dict


def extract_json(response: str) -> str:
    """
    Extract JSON from potentially wrapped response

    Claude sometimes wraps JSON in markdown code blocks or adds
    conversational preamble. This function extracts the raw JSON.

    Args:
        response: Raw response from Claude

    Returns:
        Extracted JSON string

    Examples:
        >>> extract_json('```json\\n{"key": "value"}\\n```')
        '{"key": "value"}'

        >>> extract_json('Here is the data:\\n{"key": "value"}')
        '{"key": "value"}'
    """
    response = response.strip()

    # Handle markdown code blocks
    if '```json' in response:
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end > start:
            return response[start:end]

    # Handle conversational preamble
    if not response.startswith('{'):
        start = response.find('{')
        end = response.rfind('}') + 1
        if start != -1 and end > start:
            return response[start:end]

    return response


def validate_json(data: Dict[str, Any]) -> None:
    """
    Validate extracted JSON structure

    Ensures the JSON has all required fields and proper structure
    for documentation processing.

    Args:
        data: Parsed JSON data

    Raises:
        ValueError: If validation fails

    Expected structure:
        {
            "source": "https://...",
            "pageTitle": "...",
            "sections": [...]
        }
    """
    required_fields = ['source', 'pageTitle', 'sections']
    missing = [field for field in required_fields if field not in data]

    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")

    # Validate sections structure
    if not isinstance(data['sections'], list):
        raise ValueError("'sections' must be a list")

    if len(data['sections']) == 0:
        raise ValueError("'sections' cannot be empty")


def parse_and_validate(response: str) -> Dict[str, Any]:
    """
    Extract, parse, and validate JSON in one step

    Args:
        response: Raw response from Claude

    Returns:
        Validated JSON data

    Raises:
        json.JSONDecodeError: If JSON is invalid
        ValueError: If validation fails
    """
    json_str = extract_json(response)
    data = json.loads(json_str)
    validate_json(data)
    return data
