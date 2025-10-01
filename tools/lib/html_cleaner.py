"""
HTML cleaning utilities
Strips unnecessary elements from HTML to reduce prompt size
"""

import re
from html.parser import HTMLParser


def clean_html(html: str) -> str:
    """
    Clean HTML by removing scripts, styles, and other bloat

    Args:
        html: Raw HTML content

    Returns:
        Cleaned HTML with only content-relevant tags
    """
    # Remove script tags and their content
    html = re.sub(r'<script\b[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove style tags and their content
    html = re.sub(r'<style\b[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove inline styles
    html = re.sub(r'\s+style="[^"]*"', '', html)
    html = re.sub(r"\s+style='[^']*'", '', html)

    # Remove common non-content tags
    for tag in ['nav', 'header', 'footer', 'aside']:
        html = re.sub(f'<{tag}\\b[^>]*>.*?</{tag}>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove data attributes and classes (reduce noise)
    html = re.sub(r'\s+data-[a-z-]+="[^"]*"', '', html)
    html = re.sub(r'\s+class="[^"]*"', '', html)
    html = re.sub(r'\s+id="[^"]*"', '', html)

    # Remove SVG tags (usually just icons/decorations)
    html = re.sub(r'<svg\b[^>]*>.*?</svg>', '', html, flags=re.DOTALL | re.IGNORECASE)

    # Remove comments
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)

    # Collapse multiple whitespace
    html = re.sub(r'\s+', ' ', html)
    html = re.sub(r'>\s+<', '><', html)

    return html.strip()


def extract_main_content(html: str) -> str:
    """
    Extract just the main content area from HTML

    Looks for common content containers like <main>, <article>,
    or elements with specific classes/ids.

    Args:
        html: Full HTML document

    Returns:
        Just the main content section
    """
    # Try to find main content area
    patterns = [
        r'<main\b[^>]*>(.*?)</main>',
        r'<article\b[^>]*>(.*?)</article>',
        r'<div[^>]*\bid="content"[^>]*>(.*?)</div>',
        r'<div[^>]*\bclass="[^"]*content[^"]*"[^>]*>(.*?)</div>',
    ]

    for pattern in patterns:
        match = re.search(pattern, html, flags=re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1)

    # Fallback: return body content
    body_match = re.search(r'<body\b[^>]*>(.*?)</body>', html, flags=re.DOTALL | re.IGNORECASE)
    if body_match:
        return body_match.group(1)

    # Last resort: return as-is
    return html


def prepare_html_for_extraction(html: str) -> str:
    """
    Full cleaning pipeline for HTML before Claude extraction

    Args:
        html: Raw HTML from fetch

    Returns:
        Minimal, clean HTML suitable for Claude extraction
    """
    # First extract main content
    content = extract_main_content(html)

    # Then clean it
    cleaned = clean_html(content)

    return cleaned
