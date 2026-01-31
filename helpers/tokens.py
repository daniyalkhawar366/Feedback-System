import secrets

def generate_event_token() -> str:
    return "evt_" + secrets.token_urlsafe(8)
