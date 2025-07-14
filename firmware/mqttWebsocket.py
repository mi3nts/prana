import asyncio
import websockets
import json
import ssl
from paho.mqtt.client import Client as MQTTClient

# -- MQTT Configuration --
MQTT_BROKER = "mqtt.circ.utdallas.edu"
MQTT_PORT = 8883
MQTT_TOPIC = "#"  # subscribe to all, or replace with a specific topic

# -- WebSocket Configuration --
WEBSOCKET_HOST = "0.0.0.0"
WEBSOCKET_PORT = 8765

# -- Active WebSocket clients --
connected_clients = set()

# -- Send MQTT messages to all connected WebSocket clients --
async def broadcast(topic, message):
    data = json.dumps({"topic": topic, "message": message})
    for ws in connected_clients.copy():
        try:
            await ws.send(data)
        except:
            connected_clients.remove(ws)

# -- MQTT Callbacks --
def on_connect(client, userdata, flags, rc):
    print(f"✅ MQTT connected with result code {rc}")
    client.subscribe(MQTT_TOPIC)

def on_message(client, userdata, msg):
    message = msg.payload.decode("utf-8")
    print(f"[MQTT] {msg.topic}: {message}")
    asyncio.run(broadcast(msg.topic, message))

# -- Start MQTT Client --
def start_mqtt():
    client = MQTTClient()
    client.username_pw_set("mintstest", "eryeNYj9aj")
    client.tls_set()
    client.tls_insecure_set(True)
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect("mqtt.circ.utdallas.edu", 1883, 60)
    client.loop_start()

# -- WebSocket server handler --
async def ws_handler(websocket, path):
    print("🌐 WebSocket client connected")
    connected_clients.add(websocket)
    try:
        async for _ in websocket:
            pass  # No incoming messages expected from browser
    finally:
        connected_clients.remove(websocket)

# -- Main --
async def main():
    start_mqtt()
    print(f"🚀 Starting WebSocket server on ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
    async with websockets.serve(ws_handler, WEBSOCKET_HOST, WEBSOCKET_PORT):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
