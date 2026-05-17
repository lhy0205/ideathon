import httpx
import os

# 외부 접속 시 backend/.env 파일에서 수정
# VLLM_HOST=https://AI서버ngrok주소.ngrok-free.app
VLLM_HOST = os.getenv("VLLM_HOST", "http://127.0.0.1:8001")
VLLM_MODEL = os.getenv("VLLM_MODEL", "LGAI-EXAONE/EXAONE-3.5-7.8B-Instruct")

async def analyze(prompt: str) -> str:
    url = f"{VLLM_HOST}/v1/chat/completions"
    payload = {
        "model": VLLM_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2048,
        "temperature": 0.7,
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            res = await client.post(
                url,
                json=payload,
                headers={"ngrok-skip-browser-warning": "true"}
            )
            res.raise_for_status()
            return res.json()["choices"][0]["message"]["content"]
    except httpx.TimeoutException:
        raise Exception("AI 서버 응답 시간 초과 (25초). ngrok URL이 만료되었거나 AI 서버가 꺼져 있습니다.")
    except httpx.ConnectError:
        raise Exception("AI 서버에 연결할 수 없습니다. VLLM_HOST를 확인하세요.")
