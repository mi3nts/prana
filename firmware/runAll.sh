#!/bin/bash

sleep 60


kill $(pgrep -f 'ips7100Reader.py')
sleep 5
python3 ips7100Reader.py &
sleep 5

kill $(pgrep -f 'bme280Reader.py')
sleep 5
python3 bme280Reader.py &
sleep 5

kill $(pgrep -f 'cozir001Reader.py')
sleep 5
python3 cozir001Reader.py &
sleep 5

python3 ipReader.py
sleep 5