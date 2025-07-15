import React, { useEffect, useState, useRef } from 'react';

const MQTTWebSocketViewer = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectAttempts = 10;

  const connectWebSocket = () => {
    try {
      const socket = new WebSocket('ws://localhost:5173');
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('WebSocket connected');
        setConnectionStatus('Connected');
        setReconnectAttempts(0);
      };

      socket.onmessage = (event) => {
        try {
          console.log('Raw WebSocket message received:', event.data);
          const data = JSON.parse(event.data);
          console.log('Parsed WebSocket data:', data);
          setMessages((prevMessages) => [
            ...prevMessages,
            { 
              topic: data.topic, 
              message: data.message,
              timestamp: new Date().toLocaleTimeString()
            },
          ]);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          console.error('Raw message was:', event.data);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('Disconnected');
        attemptReconnect();
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Error');
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionStatus('Error');
      attemptReconnect();
    }
  };

  const attemptReconnect = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000); 
      setConnectionStatus(`Reconnecting in ${delay/1000}s... (${reconnectAttempts + 1}/${maxReconnectAttempts})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        setReconnectAttempts(prev => prev + 1);
        connectWebSocket();
      }, delay);
    } else {
      setConnectionStatus('Failed to connect after maximum attempts');
    }
  };

  useEffect(() => {
    setConnectionStatus('Connecting...');
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return '#4CAF50';
      case 'Disconnected': return '#f44336';
      case 'Error': return '#f44336';
      default: return '#FF9800';
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>MQTT WebSocket Messages</h1>
      
      <div style={{ 
        marginBottom: '1rem', 
        padding: '1rem', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <strong>Status: </strong>
          <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
            {connectionStatus}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <strong>Messages received: {messages.length}</strong>
      </div>

      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #ddd',
        borderRadius: '4px',
        padding: '1rem'
      }}>
        {messages.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No messages received yet...</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {messages.map((msg, index) => (
              <li key={index} style={{ 
                marginBottom: '0.5rem', 
                padding: '0.5rem',
                backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                borderRadius: '4px',
                color: 'red'
              }}>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  {msg.timestamp}
                </div>
                <div>
                  <strong style={{ color: '#2196F3' }}>[{msg.topic}]</strong>: {msg.message}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MQTTWebSocketViewer;