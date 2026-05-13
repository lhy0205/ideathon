import httpx
import os

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "https://c860-203-255-221-68.ngrok-free.app")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "exaone3.5:7.8b")

async def analyze(prompt: str) -> str:
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        res = await client.post(url, json=payload)
        res.raise_for_status()
        return res.json().get("response", "")
