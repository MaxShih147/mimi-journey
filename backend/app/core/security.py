"""OAuth PKCE flow utilities and security helpers."""

import base64
import hashlib
import secrets
from urllib.parse import urlencode


def generate_state() -> str:
    """Generate a random state token for OAuth."""
    return secrets.token_urlsafe(32)


def generate_code_verifier() -> str:
    """Generate a PKCE code verifier."""
    return secrets.token_urlsafe(64)


def generate_code_challenge(verifier: str) -> str:
    """Generate PKCE code challenge from verifier using S256 method."""
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def build_google_auth_url(
    client_id: str,
    redirect_uri: str,
    state: str,
    code_challenge: str,
    scopes: list[str],
) -> str:
    """Build Google OAuth authorization URL with PKCE."""
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "access_type": "offline",
        "prompt": "consent",
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def generate_session_id() -> str:
    """Generate a secure session ID."""
    return secrets.token_urlsafe(32)
