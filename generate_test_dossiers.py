import asyncio
from backend.api.report_routes import export_investigation_dossier
from fastapi.responses import StreamingResponse

async def run():
    # Target 1: The root suspect (Binance matched)
    try:
        resp1 = await export_investigation_dossier("0xb1ad40e588959c203617cd55b5cd32cc2795a9ff")
        if isinstance(resp1, StreamingResponse):
            body = b""
            async for chunk in resp1.body_iterator:
                body += chunk
            with open("Dossier_b1ad40e5.pdf", "wb") as f:
                f.write(body)
            print("Successfully saved Dossier_b1ad40e5.pdf")
    except Exception as e:
        print(f"Error on Target 1: {e}")

    # Target 2: Different, likely unattributed address
    try:
        resp2 = await export_investigation_dossier("0x0000000000000000000000000000000000001234")
        if isinstance(resp2, StreamingResponse):
            body = b""
            async for chunk in resp2.body_iterator:
                body += chunk
            with open("Dossier_00001234.pdf", "wb") as f:
                f.write(body)
            print("Successfully saved Dossier_00001234.pdf")
    except Exception as e:
        print(f"Error on Target 2: {e}")

if __name__ == "__main__":
    asyncio.run(run())
