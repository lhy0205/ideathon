import httpx
import os

# 외부 접속 시 backend/.env 파일에서 수정
# OLLAMA_HOST=https://AI서버ngrok주소.ngrok.io
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "exaone3.5:7.8b")

async def analyze(prompt: str) -> str:
    url = f"{OLLAMA_HOST}/api/generate"
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_gpu": -1,
        },
    }
    async with httpx.AsyncClient(timeout=600.0) as client:
        res = await client.post(url, json=payload)
        res.raise_for_status()
        return res.json().get("response", "")
