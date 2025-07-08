# testing module for cozir.py

from cozir import Cozir

sensor = Cozir('/dev/serial0') 

print("CO₂:", sensor.readCO2(), "ppm")
print("Temperature:", sensor.readTemperature(), "°C")
print("Humidity:", sensor.readHumidity(), "%")