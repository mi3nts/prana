'''

code taken and modified from https://github.com/pierre-haessig/pycozir/blob/master/cozir/cozir.py

'''

import serial

class Cozir(object):
    def __init__(self, port):
        self.ser = serial.Serial(port, timeout=1)
        print('connected to "{}"'.format(port))
        
    def write(self, com):
        '''write the command `com` (bytes) followed by "\\r\\n"'''
        # print('writing "{}"'.format(com))
        self.ser.write(com + b'\r\n')
    
    # deque to find interval avg 
    # check if latest or avg
    # take both avg and latest
    def readCO2(self, with_filter=True):
        '''CO2 concentration in ppm
        
        with or without the digital smoothing filter
        
        note: the multiplier is *not implemented*.
        
        (Z or z command)
        '''
        if with_filter:
            com = b'Z'
        else:
            com = b'z'
        self.write(com)
        try:
            for _ in range(3):  # try up to 3 lines to find valid data; can crash without this
                res = self.ser.readline().strip()
                if res.startswith(com + b' '):
                    try:
                        return float(res[2:])
                    except ValueError:
                        continue
        except RuntimeError as e:
            print("Caught error in reading CO2: ", e)
    
    

    def readTemperature(self):
        self.write(b'T')

        for _ in range(3):
            res = self.ser.readline().strip()
            if res.startswith(b'T '):
                try:
                    return (float(res[2:]) - 1000) / 10.
                except ValueError:
                    continue
        print("Sensor sent unexpected temperature data!")
        return None

    
    def readHumidity(self):
        self.write(b'H')

        for _ in range(3):
            res = self.ser.readline().strip()
            if res.startswith(b'H '):
                try:
                    return (float(res[2:])) / 10.
                except ValueError:
                    continue
        print("Sensor sent unexpected humidity data!")
        return None