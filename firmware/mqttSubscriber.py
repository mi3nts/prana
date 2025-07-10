

# MQTT Client demo
# Continuously monitor two different MQTT topics for data,
# check if the received data matches two predefined 'commands'
 
import paho.mqtt.client as mqtt
import ast
import datetime
import yaml
import collections
import json
import ssl
from mintsXU4 import mintsSensorReader as mSR
from mintsXU4 import mintsDefinitions as mD
from mintsXU4 import mintsLatest as mL
import sys
import pandas as pd

mqttPort              = mD.mqttPort
mqttBroker            = mD.mqttBrokerDC
mqttCredentialsFile   = mD.credentials
# tlsCert               = mD.tlsCert
credentials           = mD.credentials

connected             = False  # Stores the connection status
broker                = mqttBroker  
port                  = mqttPort  # Secure port
mqttUN                = credentials['mqtt']['username'] 
mqttPW                = credentials['mqtt']['password'] 


decoder = json.JSONDecoder(object_pairs_hook=collections.OrderedDict)


# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
 
    # Subscribing in on_connect() - if we lose the connection and
    # reconnect then subscriptions will be renewed.
    nodeIDs   = ["d83add73168b","d83add731615","d83add7316a5"]
    sensorIDs = ["BME280Test","COZIR001Test","IPS7100Test"]

    for nodeID in nodeIDs:
        for sensorID in sensorIDs:
            topic = nodeID+"/"+ sensorID
            client.subscribe(topic)
            print("Subscrbing to Topic: "+ topic)

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
    print()
    print(" - - - MINTS DATA RECEIVED - - - ")
    print()
    # print(msg.topic+":"+str(msg.payload))
    try:
        [nodeID,sensorID] = msg.topic.split('/')
        sensorDictionary = decoder.decode(msg.payload.decode("utf-8","ignore"))
        with open("latestData.json", "r") as f:
            lines = f.readlines()

        if len(lines) > 3:      # erase old lines (and keep an extra so data doesn't ever get lost)
            with open("latestData.json", "w") as f:
                f.writelines(lines[-3:])

        with open("latestData.json", "a") as f:
            json.dump(sensorDictionary, f)
            f.write(',\n')

        print("Node ID   :" + nodeID)
        print("Sensor ID :" + sensorID)
        print("Data      : " + str(sensorDictionary))


        # IF NEEDDED USE THIS 
        # dateTime  = datetime.datetime.strptime(sensorDictionary["dateTime"], '%Y-%m-%d %H:%M:%S.%f')
        # writePath = mSR.getWritePathMQTT(nodeID,sensorID,dateTime)
        # exists    = mSR.directoryCheck(writePath)
        # print("Writing MQTT Data")
        # print(writePath)
        # mSR.writeCSV2(writePath,sensorDictionary,exists)
        # mL.writeJSONLatestMQTT(sensorDictionary,nodeID,sensorID)

        
    except Exception as e:
        print("[ERROR] Could not publish data, error: {}".format(e))

# Create an MQTT client and attach our routines to it.
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.username_pw_set(mqttUN,mqttPW)

client.tls_set( certfile=None,
                            keyfile=None, cert_reqs=ssl.CERT_REQUIRED,
                            tls_version=ssl.PROTOCOL_TLSv1_2, ciphers=None)


client.tls_insecure_set(True)
client.connect(broker, port, 60)
client.loop_forever()