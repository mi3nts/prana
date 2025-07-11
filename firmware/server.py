# server.py
import asyncio
import websockets

clients = set()

async def notify_all(message):
    if clients:
        await asyncio.gather(*[client.send(message) for client in clients])

async def ws_handler(websocket):
    clients.add(websocket)
    try:
        async for _ in websocket:
            pass
    finally:
        clients.remove(websocket)

async def start_server():
    return await websockets.serve(ws_handler, "0.0.0.0", 8765)
