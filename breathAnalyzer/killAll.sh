#!/bin/bash

echo "Stopping processes..."

# Kill mqttWebsocket.py
mqtt_pid=$(pgrep -f "mqttWebsocket.py")
if [ -n "$mqtt_pid" ]; then
    echo "Killing mqttWebsocket.py (PID: $mqtt_pid)"
    kill -9 $mqtt_pid
else
    echo "No mqttWebsocket.py process found."
fi

sleep 1
#!/bin/bash

echo "Stopping processes..."

# Kill mqttWebsocket.py (port 8765)
ws_pid=$(lsof -ti :8765)
if [ -n "$ws_pid" ]; then
    echo "Killing mqttWebsocket.py (PID: $ws_pid)"
    kill -9 $ws_pid
else
    echo "No process found on port 8765 (mqttWebsocket.py)"
fi

sleep 1

# Kill npm run dev (port 5174)
dev_pid=$(lsof -ti :5174)
if [ -n "$dev_pid" ]; then
    echo "Killing dev server on port 5174 (PID: $dev_pid)"
    kill -9 $dev_pid
else
    echo "No process found on port 5174 (npm run dev)"
fi

echo "Done."
