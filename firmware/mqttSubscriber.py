import paho.mqtt.client as mqtt
import json
import ssl
import asyncio
import collections
from mintsXU4 import mintsDefinitions as mD
import server  

mqttPort = mD.mqttPort
mqttBroker = mD.mqttBrokerDC
credentials = mD.credentials
mqttUN = credentials['mqtt']['username']
mqttPW = credentials['mqtt']['password']
decoder = json.JSONDecoder(object_pairs_hook=collections.OrderedDict)

nodeIDs = ["d83add73168b", "d83add731615", "d83add7316a5"]
sensorIDs = ["BME280Test", "COZIR001Test", "IPS7100Test"]

# asyncio event loop (needed for websocket)
loop = asyncio.get_event_loop()

def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    for nodeID in nodeIDs:
        for sensorID in sensorIDs:
            topic = f"{nodeID}/{sensorID}"
            client.subscribe(topic)
            print("Subscribing to topic:", topic)

def on_message(client, userdata, msg):
    print("\n - - - MINTS DATA RECEIVED - - - \n")
    try:
        nodeID, sensorID = msg.topic.split('/')
        sensorDictionary = decoder.decode(msg.payload.decode("utf-8", "ignore"))

        print(f"Node ID   : {nodeID}")
        print(f"Sensor ID : {sensorID}")
        print(f"Data      : {sensorDictionary}")

        # Forward to WebSocket clients
        message_json = json.dumps({
            "nodeID": nodeID,
            "sensorID": sensorID,
            "data": sensorDictionary
        })
        asyncio.run_coroutine_threadsafe(server.notify_all(message_json), loop)

    except Exception as e:
        print("[ERROR] Could not process message:", e)

async def main():
    await server.start_server()
    print("WebSocket server started")

    # Setup and start MQTT client (non-blocking)
    client = mqtt.Client()
    client.username_pw_set(mqttUN, mqttPW)
    client.tls_set(
        certfile=None,
        keyfile=None,
        cert_reqs=ssl.CERT_REQUIRED,
        tls_version=ssl.PROTOCOL_TLSv1_2,
        ciphers=None
    )
    client.tls_insecure_set(True)
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(mqttBroker, mqttPort, 60)
    client.loop_start()  # Don't block — allows WebSocket server to run

    while True:
        await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        loop.run_until_complete(main())
    except KeyboardInterrupt:
        print("Shutting down...")
