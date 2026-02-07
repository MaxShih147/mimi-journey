"""Tests for OAuth PKCE flow utilities and security helpers."""

import base64
import hashlib

from app.core.security import (
    build_google_auth_url,
    generate_code_challenge,
    generate_code_verifier,
    generate_session_id,
    generate_state,
)


class TestGenerateState:
    def test_returns_string(self):
        state = generate_state()
        assert isinstance(state, str)

    def test_returns_nonempty(self):
        assert len(generate_state()) > 0

    def test_unique_each_call(self):
        states = {generate_state() for _ in range(10)}
        assert len(states) == 10


class TestGenerateCodeVerifier:
    def test_returns_string(self):
        verifier = generate_code_verifier()
        assert isinstance(verifier, str)

    def test_sufficient_length(self):
        # PKCE verifiers should be 43-128 chars
        verifier = generate_code_verifier()
        assert len(verifier) >= 43

    def test_unique_each_call(self):
        verifiers = {generate_code_verifier() for _ in range(10)}
        assert len(verifiers) == 10


class TestGenerateCodeChallenge:
    def test_returns_string(self):
        verifier = generate_code_verifier()
        challenge = generate_code_challenge(verifier)
        assert isinstance(challenge, str)

    def test_s256_correctness(self):
        verifier = "test_verifier_string"
        expected_digest = hashlib.sha256(verifier.encode("ascii")).digest()
        expected = base64.urlsafe_b64encode(expected_digest).rstrip(b"=").decode("ascii")
        assert generate_code_challenge(verifier) == expected

    def test_deterministic(self):
        verifier = generate_code_verifier()
        c1 = generate_code_challenge(verifier)
        c2 = generate_code_challenge(verifier)
        assert c1 == c2

    def test_no_padding(self):
        verifier = generate_code_verifier()
        challenge = generate_code_challenge(verifier)
        assert "=" not in challenge

    def test_different_verifiers_produce_different_challenges(self):
        v1 = generate_code_verifier()
        v2 = generate_code_verifier()
        assert generate_code_challenge(v1) != generate_code_challenge(v2)


class TestBuildGoogleAuthUrl:
    def test_returns_google_url(self):
        url = build_google_auth_url(
            client_id="test-id",
            redirect_uri="http://localhost:8000/callback",
            state="test-state",
            code_challenge="test-challenge",
            scopes=["openid", "email"],
        )
        assert url.startswith("https://accounts.google.com/o/oauth2/v2/auth?")

    def test_contains_all_params(self):
        url = build_google_auth_url(
            client_id="test-id",
            redirect_uri="http://localhost:8000/callback",
            state="test-state",
            code_challenge="test-challenge",
            scopes=["openid", "email"],
        )
        assert "client_id=test-id" in url
        assert "state=test-state" in url
        assert "code_challenge=test-challenge" in url
        assert "code_challenge_method=S256" in url
        assert "response_type=code" in url
        assert "access_type=offline" in url
        assert "prompt=consent" in url

    def test_scopes_joined(self):
        url = build_google_auth_url(
            client_id="id",
            redirect_uri="http://localhost/cb",
            state="s",
            code_challenge="c",
            scopes=["openid", "email", "profile"],
        )
        assert "scope=openid+email+profile" in url


class TestGenerateSessionId:
    def test_returns_string(self):
        assert isinstance(generate_session_id(), str)

    def test_unique(self):
        ids = {generate_session_id() for _ in range(10)}
        assert len(ids) == 10
