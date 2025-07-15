import asyncio
import websockets
import json
from paho.mqtt.client import Client as MQTTClient
import logging
import threading

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -- MQTT Configuration --
MQTT_BROKER = "mqtt.circ.utdallas.edu"
MQTT_PORT = 8883

# -- WebSocket Configuration --
WEBSOCKET_HOST = "localhost"
WEBSOCKET_PORT = 5173

# -- Global variables (accessible from all functions) --
connected_clients = set()
message_queue = asyncio.Queue()
main_loop = None

# -- Send MQTT messages to all connected WebSocket clients --
async def broadcast_handler():
    """Continuously process messages from the queue and broadcast them"""
    global connected_clients  
    
    while True:
        try:
            topic, message = await message_queue.get()
            
            if not connected_clients:
                logger.info("No WebSocket clients connected, skipping broadcast")
                continue
            
            data = json.dumps({"topic": topic, "message": message})
            logger.info(f"Broadcasting to {len(connected_clients)} clients: {topic}")
            
            # Send to all connected clients
            disconnected_clients = set()
            for ws in connected_clients.copy():
                try:
                    await ws.send(data)
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(ws)
                except Exception as e:
                    logger.error(f"Error sending to client: {e}")
                    disconnected_clients.add(ws)
            
            connected_clients -= disconnected_clients
            logger.info(f"Message sent to {len(connected_clients)} clients")
            
        except Exception as e:
            logger.error(f"Error in broadcast handler: {e}")
            await asyncio.sleep(1)

# -- MQTT Callbacks --
def on_connect(client, userdata, flags, rc):
    logger.info(f"✅ MQTT connected with result code {rc}")
    topics = [
        "d83add73168b/BME280Test",
        "d83add731615/COZIR001Test",
        "d83add7316a5/IPS7100Test"
    ]
    for topic in topics:
        client.subscribe(topic)
        logger.info(f'Subscribed to: {topic}')

def on_message(client, userdata, msg):
    global main_loop, message_queue  
    
    message = msg.payload.decode("utf-8")
    logger.info(f"[MQTT] {msg.topic}: {message}")
    
    # Put message in queue for async processing
    try:
        if main_loop and not main_loop.is_closed():
            main_loop.call_soon_threadsafe(message_queue.put_nowait, (msg.topic, message))
            logger.info("Message queued for broadcast")
        else:
            logger.error("Main loop not available")
    except Exception as e:
        logger.error(f"Error queuing message: {e}")

# -- Start MQTT Client --
def start_mqtt():
    client = MQTTClient()
    client.username_pw_set("mintstest", "eryeNYj9Aj")
    client.tls_set()
    client.tls_insecure_set(True)
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        logger.info("MQTT client started successfully")
    except Exception as e:
        logger.error(f"Failed to start MQTT client: {e}")

# -- WebSocket server handler --
async def ws_handler(websocket):
    global connected_clients  
    
    logger.info(f"WebSocket client connected from {websocket.remote_address}")
    connected_clients.add(websocket)
    logger.info(f"Total connected clients: {len(connected_clients)}")
    
    try:
        welcome_msg = json.dumps({
            "topic": "system/welcome", 
            "message": "Connected to MQTT WebSocket bridge"
        })
        await websocket.send(welcome_msg)
        logger.info("Welcome message sent to client")
        
        # Keep the connection alive
        await websocket.wait_closed()
        
    except websockets.exceptions.ConnectionClosed:
        logger.info("WebSocket client disconnected normally")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)
        logger.info(f"Client removed. Remaining clients: {len(connected_clients)}")

# -- Main --
async def main():
    global main_loop, message_queue  # message queue global, otherwise can't be found
    
    main_loop = asyncio.get_running_loop()
    
    logger.info(f"🚀 Starting WebSocket server on ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
    
    broadcast_task = asyncio.create_task(broadcast_handler())
    
    # Start the WebSocket server
    async with websockets.serve(ws_handler, WEBSOCKET_HOST, WEBSOCKET_PORT):
        logger.info(f"WebSocket server started on {WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
        
        # MQTT client in a separate thread
        mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
        mqtt_thread.start()
        
        # keep the server running
        await asyncio.Future() 

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped by user")