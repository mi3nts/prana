# # testing module for cozir.py

from mintsLib.cozir001Driver import Cozir
from collections import deque
import time
from mintsXU4 import mintsSensorReader as mSR
from collections import OrderedDict
import datetime
import threading


sensor = Cozir('/dev/serial0') 

checkTrials  = 0
loopInterval = 2 

serial_lock = threading.Lock()

def safe_readCO2(sensor, with_filter):
    with serial_lock:
        return sensor.readCO2(with_filter)

def main(loopInterval):
    startTime    = time.time()
    while True:
        try:
            currentUnfilteredCO2 = safe_readCO2(sensor, with_filter=False)
            currentFilteredCO2   = sensor.readCO2(with_filter=True)
            currentTemperature   = sensor.readTemperature()
            currentHumidity      = sensor.readHumidity()
            dateTime   = datetime.datetime.now()
            sensorName = "COZIR001Test"


            sensorDictionary =  OrderedDict([
                    ("dateTime" , str(dateTime)), # always the same
                    ("co2Latest"    ,currentUnfilteredCO2), 
                    ("co2Filtered"  ,currentFilteredCO2),
                    ("temperature"  ,currentTemperature),
                    ("humidity"     ,currentHumidity),
                    ])
            mSR.sensorFinisher(dateTime,sensorName,sensorDictionary)
            
            startTime = mSR.delayMints(time.time() - startTime,loopInterval)

        except Exception as e:
            print(e)
            time.sleep(10)
        

if __name__ == "__main__":
    print("=============")
    print("    MINTS    ")
    print("=============")
    print("Monitoring COZIR data for Prana")
    main(loopInterval)
