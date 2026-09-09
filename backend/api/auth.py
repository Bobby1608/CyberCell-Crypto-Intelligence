import os
from fastapi import Security, HTTPException, status, Query
from fastapi.security import APIKeyHeader

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(
    api_key_header: str = Security(api_key_header),
    api_key_query: str = Query(None, alias="api_key")
):
    expected_api_key = os.getenv("API_KEY")
    if not expected_api_key:
        raise RuntimeError("API_KEY environment variable is not set. Refusing to secure endpoints with a weak default.")
        
    api_key = api_key_header or api_key_query
    if not api_key or api_key != expected_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key",
        )
    return api_key_header
