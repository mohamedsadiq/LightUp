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
  const portRef = useRef<chrome.runtime.Port | null>(null);

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      
      // Clean up existing port if it exists
      if (portRef.current) {
        try {
          portRef.current.disconnect();
        } catch (e) {
          console.error('Error disconnecting existing port:', e);
        }
      }
      
      const newPort = chrome.runtime.connect({ 
        name: `text-processing-${connectionId}`
      });
      
      newPort.onMessage.addListener((message: PortMessage) => {
        handleStreamResponse(message);
      });

      newPort.onDisconnect.addListener(() => {
        console.log('Port disconnected');
        if (chrome.runtime.lastError) {
          console.error('Port error:', chrome.runtime.lastError);
        }
        
        if (connectionStatus !== 'connecting') {
          setConnectionStatus('disconnected');
        }
      });

      setPort(newPort);
      portRef.current = newPort;
      setConnectionStatus('connected');
      return newPort;
    } catch (e) {
      console.error('Failed to connect port:', e);
      setConnectionStatus('disconnected');
      setError('Connection failed. Please try again.');
      portRef.current = null;
      return null;
    }
  };

  const reconnect = () => {
    setError(null);
    return connect();
  };

  // Safely send a message through the port, with automatic reconnection if needed
  const safelySendMessage = (message: any): boolean => {
    try {
      if (!portRef.current) {
        const newPort = reconnect();
        if (!newPort) return false;
      }
      
      portRef.current?.postMessage(message);
      return true;
    } catch (e) {
      console.error('Error sending message:', e);
      
      // Try to reconnect once
      try {
        const newPort = reconnect();
        if (!newPort) return false;
        
        // Try again with the new port
        newPort.postMessage(message);
        return true;
      } catch (e2) {
        console.error('Failed to reconnect and send message:', e2);
        setError('Connection lost. Please try again.');
        return false;
      }
    }
  };

  useEffect(() => {
    const newPort = connect();
    
    // Set up periodic connection check
    const connectionChecker = setInterval(() => {
      if (portRef.current) {
        try {
          // Test if the port is still active by sending a ping
          portRef.current.postMessage({ type: "PING" });
        } catch (e) {
          console.log('Connection test failed, reconnecting...');
          reconnect();
        }
      } else if (connectionStatus !== 'disconnected') {
        // If we don't have a port but think we're connected, reconnect
        reconnect();
      }
    }, 30000); // Check every 30 seconds, but don't terminate
    
    return () => {
      clearInterval(connectionChecker);
      
      if (portRef.current) {
        try {
          portRef.current.postMessage({
            type: "STOP_GENERATION",
            connectionId
          });
          portRef.current.disconnect();
        } catch (e) {
          console.error('Error cleaning up port:', e);
        }
      }
      portRef.current = null;
    };
  }, [connectionId]);

  const handleStreamResponse = (msg: PortMessage) => {
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
    }
  };

  return {
    port: portRef.current,
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