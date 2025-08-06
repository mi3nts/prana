import asyncio
import websockets
import json
from paho.mqtt.client import Client as MQTTClient
import logging
import threading
import subprocess
from mintsXU4 import mintsDefinitions as mD
import collections

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


MQTT_BROKER = mD.mqttBrokerDC
MQTT_PORT = mD.mqttPort
credentials = mD.credentials
UN = credentials['mqtt']['username']
PW = credentials['mqtt']['password']
decoder = json.JSONDecoder(object_pairs_hook=collections.OrderedDict)

WEBSOCKET_HOST = "localhost"
WEBSOCKET_PORT = 8765

connected_clients = set()
message_queue = asyncio.Queue()
main_loop = None

# Function to run systemd service
async def run_prana_service(data=None):
    """Run the prana-script.service using systemctl"""
    try:
        logger.info("Starting prana-script.service...")
        
        # Run systemctl start command
        result = subprocess.run(
            ['sudo', 'systemctl', 'start', 'prana-script.service'],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            logger.info("prana-script.service started successfully")
            return {
                'success': True,
                'message': 'prana-script.service started successfully',
                'output': result.stdout
            }
        else:
            logger.error(f"Failed to start prana-script.service: {result.stderr}")
            return {
                'success': False,
                'message': 'Failed to start prana-script.service',
                'error': result.stderr
            }
            
    except subprocess.TimeoutExpired:
        logger.error("prana-script.service start command timed out")
        return {
            'success': False,
            'message': 'Service start command timed out',
            'error': 'Command execution exceeded 30 seconds'
        }
    except Exception as e:
        logger.error(f"Error starting prana-script.service: {e}")
        return {
            'success': False,
            'message': 'Error starting service',
            'error': str(e)
        }

# Handle incoming WebSocket messages from clients 
async def handle_client_message(websocket, message):
    """Handle messages received from WebSocket clients"""
    try:
        data = json.loads(message)
        action = data.get('action')
        
        logger.info(f"Received action: {action}")
        
        if action == 'run-prana-script':
            # Extract any data that was sent
            payload_data = data.get('data', {})
            logger.info(f"Running prana script with data: {payload_data}")
            
            # Run the systemd service
            result = await run_prana_service(payload_data)
            
            # Send result back to the client
            response = {
                'type': 'prana-script-result',
                'timestamp': asyncio.get_event_loop().time(),
                **result
            }
            
            await websocket.send(json.dumps(response))
            logger.info(f"Sent response to client: {result['success']}")
            
        elif action == 'run-script':
            # Handle your existing run-script action
            logger.info("Handling existing run-script action")
            # Add your existing script logic here if needed
            
        else:
            logger.warning(f"Unknown action received: {action}")
            await websocket.send(json.dumps({
                'type': 'error',
                'message': f'Unknown action: {action}'
            }))
            
    except json.JSONDecodeError:
        logger.error("Invalid JSON received from client")
        await websocket.send(json.dumps({
            'type': 'error',
            'message': 'Invalid JSON format'
        }))
    except Exception as e:
        logger.error(f"Error handling client message: {e}")
        await websocket.send(json.dumps({
            'type': 'error',
            'message': f'Server error: {str(e)}'
        }))

# Send MQTT messages to all connected WebSocket clients
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
    logger.info(f"MQTT connected with result code {rc}")
    topics = [
        "d83add7316a5/BME280Test",
        "d83add7316a5/COZIR001Test",
        "d83add7316a5/IPS7100Test"          
    ]
    for topic in topics:
        client.subscribe(topic)
        logger.info(f'Subscribed to: {topic}')

def on_message(client, userdata, msg):
    global main_loop, message_queue  
    
    message = msg.payload.decode("utf-8")
    logger.info(f"[MQTT] {msg.topic}: {message}")
    
    try:
        if main_loop and not main_loop.is_closed():
            main_loop.call_soon_threadsafe(message_queue.put_nowait, (msg.topic, message))
            logger.info("Message queued for broadcast")
        else:
            logger.error("Main loop not available")
    except Exception as e:
        logger.error(f"Error queuing message: {e}")

def start_mqtt():
    client = MQTTClient()
    client.username_pw_set(UN, PW)
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
        
        # Listen for incoming messages from the client
        async for message in websocket:
            await handle_client_message(websocket, message)
        
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
    
    logger.info(f"Starting WebSocket server on ws://{WEBSOCKET_HOST}:{WEBSOCKET_PORT}")
    
    broadcast_task = asyncio.create_task(broadcast_handler())
    
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