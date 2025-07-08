from smbus2 import SMBus, i2c_msg
import struct
import time

class IpsSensor:
    POLY = 0x8408
    I2C_ADDRESS = 0x4B

    def __init__(self, bus_number=4):
        self.bus = SMBus(bus_number)
        self.pc_values = [0]*7
        self.pm_values = [0.0]*7
        self.event_status = 0
        self.debug = True

    def begin(self):
        """
        Initialize sensor and start measurements with 200ms sampling
        """

        # send start measurement command
        self.bus.write_i2c_block_data(self.I2C_ADDRESS, 0x10, [0x01])
        time.sleep(5)  # warm-up

    def get_checksum(self, data):
        crc = 0xFFFF
        for b in data:
            d = b & 0xFF
            for i in range(8):
                if (crc & 0x0001) ^ (d & 0x0001):
                    crc = (crc >> 1) ^ self.POLY
                else:
                    crc >>= 1
                d >>= 1
        crc = ~crc & 0xFFFF
        crc = ((crc << 8) & 0xFF00) | ((crc >> 8) & 0x00FF)
        return crc

    def read_i2c(self, command, reply_size, checksum=True):
        """
        Send a command, then read reply_size bytes, verify checksum if requested
        """
        while True:
            # write the command
            self.bus.write_byte(self.I2C_ADDRESS, command)
            # read reply_size bytes
            read = i2c_msg.read(self.I2C_ADDRESS, reply_size)
            self.bus.i2c_rdwr(read)
            res = list(read)

            if self.debug:
                print(f"Received: {res}")

            if not checksum:
                return res

            calculated_crc = self.get_checksum(res[:-2])
            received_crc = (res[-2] << 8) | res[-1]
            if self.debug:
                print(f"CRC calc: {hex(calculated_crc)} vs received: {hex(received_crc)}")
            if calculated_crc == received_crc:
                return res
            else:
                if self.debug:
                    print("Checksum failed, retrying...")
                time.sleep(0.1)

    def update(self):
        """
        Grab PC and PM data and decode them
        """
        # read PC data
        pc_raw = self.read_i2c(0x11, 30, checksum=True)
        for i in range(7):
            idx = i*4
            self.pc_values[i] = int.from_bytes(pc_raw[idx:idx+4], byteorder='big')

        # read PM data
        pm_raw = self.read_i2c(0x12, 32, checksum=True)
        for i in range(7):
            idx = i*4
            self.pm_values[i] = struct.unpack('<f', bytes(pm_raw[idx:idx+4]))[0]
        # event status:
        self.event_status = (pm_raw[28] << 8) | pm_raw[29]

    # accessors
    def getPC(self):
        return self.pc_values

    def getPM(self):
        return self.pm_values

    def getEventStatus(self):
        return self.event_status

    def set_debug(self, flag):
        self.debug = flag

    def close(self):
        self.bus.close()