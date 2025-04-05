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
  reconnect: () => chrome.runtime.Port | null;
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
  
  // Add a buffer for chunking updates
  const textBufferRef = useRef<string>("");
  const followUpBufferRef = useRef<Map<number, string>>(new Map());
  const updateTimeoutRef = useRef<number | null>(null);

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

  useEffect(() => {
    // This effect initializes the port connection when the component mounts
    let currentPort: chrome.runtime.Port | null = null;
    
    try {
      currentPort = connect();
    } catch (e) {
      console.error('Error connecting port on mount:', e);
      setConnectionStatus('disconnected');
      setError('Failed to establish connection.');
    }
    
    // Clean up function to disconnect the port when the component unmounts
    return () => {
      if (currentPort) {
        try {
          currentPort.disconnect();
          console.log('Port disconnected on unmount');
        } catch (e) {
          console.error('Error disconnecting port on unmount:', e);
        }
      }
      
      // Clear any pending timeouts
      if (updateTimeoutRef.current !== null) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [connectionId]); // Only re-run if connectionId changes

  // Add a function to flush text buffers to state
  const flushTextBuffers = () => {
    // Update main text if there's anything in the buffer
    if (textBufferRef.current) {
      setStreamingText(prev => prev + textBufferRef.current);
      textBufferRef.current = "";
    }
    
    // Update follow-up answers if there's anything in those buffers
    if (followUpBufferRef.current.size > 0 && onFollowUpUpdate) {
      followUpBufferRef.current.forEach((content, id) => {
        onFollowUpUpdate(id, content);
        followUpBufferRef.current.delete(id);
      });
    }
    
    // Clear the timeout reference
    updateTimeoutRef.current = null;
  };

  // Schedule flushing buffers
  const scheduleBufferFlush = () => {
    if (updateTimeoutRef.current === null) {
      updateTimeoutRef.current = window.setTimeout(flushTextBuffers, 33); // ~30fps, fast enough to feel responsive
    }
  };

  const handleStreamResponse = (msg: PortMessage) => {
    switch (msg.type) {
      case 'chunk':
        if (msg.content) {
          if (msg.isFollowUp && msg.id && onFollowUpUpdate) {
            // Add to follow-up buffer
            const currentBuffer = followUpBufferRef.current.get(msg.id) || "";
            followUpBufferRef.current.set(msg.id, currentBuffer + msg.content);
            scheduleBufferFlush();
          } else {
            // Handle backspace character specially for immediate feedback
            if (msg.content.includes('\b')) {
              setStreamingText(""); // Clear the "Thinking..." text immediately
            } else {
              // Add to main text buffer
              textBufferRef.current += msg.content;
              scheduleBufferFlush();
            }
          }
        }
        break;

      case 'done':
        // Flush any remaining buffered content immediately
        flushTextBuffers();
        
        if (msg.isFollowUp && msg.id && onFollowUpComplete) {
          onFollowUpComplete(msg.id);
        }
        setIsLoading(false);
        break;

      case 'error':
        // Flush any remaining buffered content immediately
        flushTextBuffers();
        
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