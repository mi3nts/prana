from mintsLib.ips7100Driver import IpsSensor
import time
from mintsXU4 import mintsSensorReader as mSR
import datetime
from collections import OrderedDict

checkTrials  = 0
loopInterval = 2 


def main():
    ips = IpsSensor(bus_number=4)
    ips.set_debug(True)
    ips.begin()

    startTime    = time.time()
    try:
        while True:
            ips.update()
            pc = ips.getPC()
            pm = ips.getPM()
            event = ips.getEventStatus()
            print(f"Event Status: {event}")
            print("--------------------------------")

            dateTime   = datetime.datetime.now()
            sensorName = "IPS7100Test"
            dataLength1 = 7
            dataLength2 = 7
            if(len(pc) == (dataLength1) and len(pm) == (dataLength2)):
                sensorDictionary =  OrderedDict([
                        ("dateTime" , str(dateTime)), # always the same
                        ("pc0_1"  ,pc[0]), 
                        ("pc0_3"  ,pc[1]),
                        ("pc0_5"  ,pc[2]),
                        ("pc1_0"  ,pc[3]),
                        ("pc2_5"  ,pc[4]),
                        ("pc5_0"  ,pc[5]), 
                        ("pc10_0" ,pc[6]),
                        ("pm0_1"  ,pm[0]),
                        ("pm0_3"  ,pm[1]),
                        ("pm0_5"  ,pm[2]), 
                        ("pm1_0"  ,pm[3]),
                        ("pm2_5"  ,pm[4]),
                        ("pm5_0"  ,pc[5]),         
                        ("pm10_0" ,pm[6]),
                        ])
                mSR.sensorFinisher(dateTime,sensorName,sensorDictionary)
            
            startTime = mSR.delayMints(time.time() - startTime,loopInterval)

    except KeyboardInterrupt:
        print("stopping...")
    finally:
        ips.close()





if __name__ == "__main__":
    print("=============")
    print("    MINTS    ")
    print("=============")
    print("Monitoring IPS7100 data for Prana")
    main(loopInterval)
