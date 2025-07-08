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
        print('writing "{}"'.format(com))
        self.ser.write(com + b'\r\n')
    
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
        
        for _ in range(5):  # try up to 5 lines to find valid data
            res = self.ser.readline().strip()
            if res.startswith(com + b' '):
                try:
                    return float(res[2:])
                except ValueError:
                    continue
        raise RuntimeError("CO2 response invalid or missing.")

    def readTemperature(self):
        self.write(b'T')

        for _ in range(5):
            res = self.ser.readline().strip()
            if res.startswith(b'T '):
                try:
                    return (float(res[2:]) - 1000) / 10.
                except ValueError:
                    continue
        print("Sensor sent unexpected temperature data!")
        return None

    
    def readHumidity(self):
        self.write(b'T')

        for _ in range(5):
            res = self.ser.readline().strip()
            if res.startswith(b'T '):
                try:
                    return (float(res[2:]) - 1000) / 10.
                except ValueError:
                    continue
        print("Sensor sent unexpected temperature data!")
        return None