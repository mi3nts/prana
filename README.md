# prana (Breath Analyzer)
Breath analyzer projects focus on using exhaled breath to detect mind reflections and perceptions of man. By analyzing Co2 and other parameters in breath, we aim to identify various  part of a person that thinks, reasons, feels, and remembers under sociological concept.

## Breath Analyzer Image
![ModuleSetup](https://github.com/mi3nts/mintsInsight/blob/main/summer2025/tundeAwoyinka/datasheets/breath_analysis/Prana.png)


## Breath Analyzer Circuit Diagram
![ModuleSetup](https://github.com/mi3nts/prana/blob/main/res/Prana1.png)

Using a CozIR-AHE-1 CO2 sensor, BME 280 and IPS7100  with a Raspberry Pi involves connecting the sensors to the Raspberry Pi via its UART serial and I2C interface and then writing code to communicate with it and interpret the data as follows.


| Pressure Range|      Label        |                                                   Reflection                                                           | 
|---------------|-------------------|------------------------------------------------------------------------------------------------------------------------|
|  0 - 19       | Dormant Vitality  | “Barely there, this breath stays hidden. Prāṇa is introverted today—maybe it skipped breakfast?                        | 
|  20 - 39      | Conditioned Flow  | “Measured and polite, this breath knows how to RSVP. Prāṇa adapts. Efficient. Predictable. Engineer-approved.”         | 
|  40 - 59      | Disciplined Pulse | “Structured like your project timeline—steady but uninspired. Prāṇa conforms to code... until debug mode is triggered.”|  
|  60 - 79      | Expressive Prāṇa  | “This breath has feelings—and a to-do list. Prāṇa resists optimization. It wants to feel something.”                   |
|  80 -100      | Radiant Overflow  | “Your breath just filled the room. And your inbox. Prāṇa is here to disrupt... respectfully, of course.”               |


## Further technical details 
Further technical details for each Sensor can be found in the readme below
- IPS7100 sensor can be found in the [Readme](https://github.com/mi3nts/mintsInsight/tree/main/summer2025/tundeAwoyinka/firmware/pro06022025)
- BME 280 Sensor [ReadMe](https://github.com/mi3nts/mintsInsight/blob/main/summer2025/tundeAwoyinka/firmware/pro07012025/README.rst)
- CozIR-AHE-1 CO2 sensor [ReadMe](https://github.com/mi3nts/mintsInsight/blob/main/summer2025/tundeAwoyinka/firmware/pro07162025/Readme.md)
- Raspberry Pi [ReadMe](https://github.com/mi3nts/mintsInsight/blob/main/summer2025/tundeAwoyinka/datasheets/RaspberryPi/RpiSetup1.md)



most of the parts you care about are in App.jsx, server.py, mqttSubscriber.py

## To run:
**python3 firmware/mqttWebsocket.py**
in breathAnalyzer, do **npm run dev**

this will open the website at localhost:5173
