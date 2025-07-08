#!/bin/bash

sleep 1


kill $(pgrep -f 'ips7100Reader.py')
sleep 1

kill $(pgrep -f 'bme280Reader.py')
sleep 1

kill $(pgrep -f 'cozir001Reader.py')
sleep 1

python3 ipReader.py
sleep 1


