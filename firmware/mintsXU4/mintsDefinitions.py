
from getmac import get_mac_address
import serial.tools.list_ports
import yaml

def findMacAddress():
    macAddress= get_mac_address(interface="eth0")
    if (macAddress!= None):
        return macAddress.replace(":","")

    macAddress= get_mac_address(interface="docker0")
    if (macAddress!= None):
        return macAddress.replace(":","")

    macAddress= get_mac_address(interface="enp1s0")
    if (macAddress!= None):
        return macAddress.replace(":","")

    macAddress= get_mac_address(interface="wlan0")
    if (macAddress!= None):
        return macAddress.replace(":","")

    return "xxxxxxxx"





mqttBrokerDC              = "mqtt.circ.utdallas.edu"


macAddress            = findMacAddress()
latestDisplayOn       = False
latestOn              = True
# airmarPort            = findAirmarPort()
# For MQTT 
mqttOn                = True

mqttCredentialsFile   = 'mintsXU4/credentials/credentials.yml'
mintsDefinitionsFile  = 'mintsXU4/credentials/mintsDefinitions.yml'
hostsFile             = 'mintsXU4/hosts.yml'
locationsFile         = 'mintsXU4/locations.yml'

mintsDefinitions      = yaml.load(\
                                open(mintsDefinitionsFile),\
                                Loader=yaml.FullLoader)

dataFolderPre            = mintsDefinitions['dataFolder']
dataFolder                = dataFolderPre + "/raw"
dataFolderMQTT            = dataFolderPre + "/rawMQTT"



mqttBroker            = "mqtt.circ.utdallas.edu"
mqttPort              =  8883  # Secure port


credentials           = yaml.load(open(mqttCredentialsFile), Loader=yaml.Loader)
# tlsCert               = mintsDefinitions['tlsCert']   


if __name__ == "__main__":
    # the following code is for debugging
    # to make sure everything is working run python3 mintsDefinitions.py 
    print("Mac Address          : {0}".format(macAddress))
    print("Data Folder Raw      : {0}".format(dataFolder))

    print("Latest On            : {0}".format(latestDisplayOn))
    print("Latest On                  : {0}".format(latestOn))
    print("MQTT On                    : {0}".format(mqttOn))
    print("MQTT Credentials File      : {0}".format(mqttCredentialsFile))
    print("MQTT Broker and Port       : {0}, {1}".format(mqttOn,mqttPort))
