"""
Claude CLI client wrapper
Handles Claude CLI interaction with proper environment isolation
"""

import os
import subprocess
from typing import Dict


def clean_environment() -> Dict[str, str]:
    """
    Remove Claude Code env vars to avoid recursion

    When running inside Claude Code, the CLAUDECODE environment
    variable causes the CLI to refuse to run (recursion protection).
    This function removes those variables.

    Returns:
        Clean environment dict
    """
    env = os.environ.copy()
    env.pop('CLAUDECODE', None)
    env.pop('CLAUDE_CODE_ENTRYPOINT', None)
    env.pop('CLAUDE_CODE_SSE_PORT', None)
    return env


def call_claude(
    prompt: str,
    model: str,
    timeout: int = 300
) -> subprocess.CompletedProcess:
    """
    Call Claude CLI with clean environment

    Args:
        prompt: Full prompt to send to Claude
        model: Model name (e.g., 'claude-sonnet-4-5-20250929')
        timeout: Timeout in seconds (default: 300 = 5 minutes)

    Returns:
        CompletedProcess with stdout/stderr/returncode

    Raises:
        subprocess.TimeoutExpired: If command times out
        FileNotFoundError: If 'claude' command not found

    Example:
        >>> result = call_claude("Extract this data...", "claude-sonnet-4")
        >>> if result.returncode == 0:
        ...     data = json.loads(result.stdout)
    """
    env = clean_environment()

    return subprocess.run(
        ['claude', '--model', model],
        input=prompt,
        capture_output=True,
        text=True,
        env=env,
        timeout=timeout
    )


def is_claude_available() -> bool:
    """
    Check if Claude CLI is available

    Returns:
        True if 'claude' command is in PATH
    """
    import shutil
    return shutil.which('claude') is not None
