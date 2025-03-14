import { useState, useEffect, useRef } from 'react';

interface PortMessage {
  type: string;
  content?: string;
  error?: string;
  isFollowUp?: boolean;
  id?: number;
  timestamp?: number;
}

interface UsePortReturn {
  port: chrome.runtime.Port | null;
  streamingText: string;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  handleStreamResponse: (msg: PortMessage) => void;
  setStreamingText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  reconnect: () => void;
}

export const usePort = (
  connectionId: string,
  onFollowUpUpdate?: (id: number, content: string) => void,
  onFollowUpComplete?: (id: number) => void
): UsePortReturn => {
  const [port, setPort] = useState<chrome.runtime.Port | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const lastHeartbeatRef = useRef<number>(Date.now());
  const connectionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      const newPort = chrome.runtime.connect({ 
        name: `text-processing-${connectionId}`
      });
      
      newPort.onMessage.addListener((message: PortMessage) => {
        handleStreamResponse(message);
      });

      newPort.onDisconnect.addListener(() => {
        console.log('Port disconnected');
        setConnectionStatus('disconnected');
      });

      setPort(newPort);
      setConnectionStatus('connected');
      return newPort;
    } catch (e) {
      console.error('Failed to connect port:', e);
      setConnectionStatus('disconnected');
      setError('Connection failed. Please try again.');
      return null;
    }
  };

  const reconnect = () => {
    if (port) {
      try {
        port.disconnect();
      } catch (e) {
        console.error('Error disconnecting port:', e);
      }
    }
    
    setError(null);
    connect();
  };

  useEffect(() => {
    const newPort = connect();
    
    // Set up connection health monitoring
    connectionCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // If we haven't received a heartbeat in 30 seconds and we're supposed to be connected
      if (now - lastHeartbeatRef.current > 30000 && connectionStatus === 'connected' && isLoading) {
        console.log('Connection seems dead, reconnecting...');
        reconnect();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (newPort) {
        try {
          newPort.postMessage({
            type: "STOP_GENERATION",
            connectionId
          });
          newPort.disconnect();
        } catch (e) {
          console.error('Error cleaning up port:', e);
        }
      }
      
      if (connectionCheckIntervalRef.current) {
        clearInterval(connectionCheckIntervalRef.current);
      }
    };
  }, [connectionId]);

  const handleStreamResponse = (msg: PortMessage) => {
    // Update last heartbeat time for any message received
    lastHeartbeatRef.current = Date.now();
    
    switch (msg.type) {
      case 'chunk':
        if (msg.content) {
          if (msg.isFollowUp && msg.id && onFollowUpUpdate) {
            onFollowUpUpdate(msg.id, msg.content);
          } else {
            setStreamingText(prev => prev + msg.content);
          }
        }
        break;

      case 'done':
        if (msg.isFollowUp && msg.id && onFollowUpComplete) {
          onFollowUpComplete(msg.id);
        }
        setIsLoading(false);
        break;

      case 'error':
        setError(msg.error || 'An unknown error occurred');
        setIsLoading(false);
        break;
        
      case 'heartbeat':
        // Just update the lastHeartbeat time
        break;
    }
  };

  return {
    port,
    streamingText,
    isLoading,
    error,
    connectionStatus,
    handleStreamResponse,
    setStreamingText,
    setIsLoading,
    setError,
    reconnect
  };
}; 