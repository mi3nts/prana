#!/usr/bin/python

import sys
import time
import os
import smbus2
#from i2cMints.i2c_scd30 import SCD30
from i2cMints.i2c_bme280v3 import BME280V3

from mintsXU4 import mintsSensorReader as mSR

debug        = False 
bus          = smbus2.SMBus(5)

# # BME280V3
bme280v3     = BME280V3(bus,debug)


checkTrials  = 0
loopInterval = 2 

def main(loopInterval):
    bme280v3_valid   = bme280v3.initiate(30)

    startTime    = time.time()
    while True:
        try:
            print("======= BME280V3 ========")
            if bme280v3_valid:
                mSR.BME280V3WriteTest(bme280v3.read())
            time.sleep(1)     
            
            startTime = mSR.delayMints(time.time() - startTime,loopInterval)
            
        except Exception as e:
            print(e)
            time.sleep(10)
        
if __name__ == "__main__":
    print("=============")
    print("    MINTS    ")
    print("=============")
    print("Monitoring Climate data for Prana")
    main(loopInterval)
