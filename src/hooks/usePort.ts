import { useState, useEffect, useRef } from 'react';

const STREAM_FLUSH_INTERVAL_MS = 80;

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
  /**
   * Preferred way for external code to deliver a message. It automatically
   * reconnects (once) if the underlying channel was dropped and retries the
   * send so the user never notices a failure.
   */
  sendMessage: (message: any) => boolean;
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
  const streamingBufferRef = useRef<string>('');
  const streamingFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushStreamingBuffer = () => {
    if (!streamingBufferRef.current) return;
    const bufferedText = streamingBufferRef.current;
    streamingBufferRef.current = '';
    if (streamingFlushTimerRef.current) {
      clearTimeout(streamingFlushTimerRef.current);
      streamingFlushTimerRef.current = null;
    }
    setStreamingText(prev => prev + bufferedText);
  };

  const scheduleStreamingFlush = () => {
    if (streamingFlushTimerRef.current) return;
    streamingFlushTimerRef.current = setTimeout(() => {
      flushStreamingBuffer();
    }, STREAM_FLUSH_INTERVAL_MS);
  };

  const connect = () => {
    try {
      setConnectionStatus('connecting');
      
      // Clean up existing port if it exists
      if (portRef.current) {
        try {
          // Disconnect underlying raw port if this is a proxy, otherwise the port itself
          const rawToClose = (portRef.current as any).__RAW_PORT__ ?? portRef.current;
          rawToClose.disconnect();
        } catch (e) {
          console.error('Error disconnecting existing port:', e);
        }
      }
      
      const rawPort = chrome.runtime.connect({ 
        name: `text-processing-${connectionId}`
      });

      // Helper that safely delivers a message through the *current* raw port. It
      // will transparently try to reconnect **once** if the channel has been
      // severed (tab was backgrounded, page navigated, etc.).
      const safePostMessage = (message: any): void => {
        const trySend = (p: chrome.runtime.Port | null, msg: any): boolean => {
          try {
            p?.postMessage(msg);
            return true;
          } catch (err) {
            return false;
          }
        };

        // Attempt with the present raw port first
        if (!trySend(rawPort, message)) {
          console.warn('[LightUp] Port send failed – attempting silent reconnect');
          const newPort = reconnect();
          // If we successfully re-established the channel, retry once
          if (!trySend((newPort as any)?.__RAW_PORT__ ?? null, message)) {
            console.error('[LightUp] Retried send failed – giving up');
          }
        }
      };

      // Glue the original events so existing listeners still fire.
      rawPort.onMessage.addListener((message: PortMessage) => {
        handleStreamResponse(message);
      });

      rawPort.onDisconnect.addListener(() => {
        console.log('[LightUp] Port disconnected');
        if (chrome.runtime.lastError) {
          console.error('[LightUp] Port error:', chrome.runtime.lastError);
        }
        setConnectionStatus('disconnected');
        // Automatically attempt a silent reconnect so the user never notices
        reconnect();
      });

      // Build a proxy object so calling code can keep using `port.postMessage`
      // without changes while we intercept and harden the call.
      const proxyPort: chrome.runtime.Port & { __RAW_PORT__: chrome.runtime.Port } = Object.assign({}, rawPort, {
        postMessage: safePostMessage,
        __RAW_PORT__: rawPort
      });

      setPort(proxyPort);
      portRef.current = proxyPort;
      setConnectionStatus('connected');
      return proxyPort;
    } catch (e) {
      console.error('[LightUp] Failed to connect port:', e);
      setConnectionStatus('disconnected');
      setError('Connection failed. Trying again…');
      portRef.current = null;
      return null;
    }
  };

  const reconnect = () => {
    setError(null);
    return connect();
  };

  // Safely send a message through whichever port is current. This remains for
  // components that prefer explicit control, but most calls now go through the
  // patched postMessage above.
  const safelySendMessage = (message: any): boolean => {
    if (!portRef.current) {
      reconnect();
    }
    try {
      portRef.current?.postMessage(message);
      return true;
    } catch (e) {
      console.error('[LightUp] Explicit send failed – attempting reconnect', e);
      const newPort = reconnect();
      try {
        newPort?.postMessage(message);
        return true;
      } catch (e2) {
        console.error('[LightUp] Explicit retry failed', e2);
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

  useEffect(() => () => {
    if (streamingFlushTimerRef.current) {
      clearTimeout(streamingFlushTimerRef.current);
      streamingFlushTimerRef.current = null;
    }
    streamingBufferRef.current = '';
  }, []);

  const handleStreamResponse = (msg: PortMessage) => {
    switch (msg.type) {
      case 'chunk':
        if (msg.content) {
          if (msg.isFollowUp && msg.id && onFollowUpUpdate) {
            onFollowUpUpdate(msg.id, msg.content);
          } else {
            streamingBufferRef.current += msg.content;
            scheduleStreamingFlush();
          }
        }
        break;

      case 'done':
        flushStreamingBuffer();
        if (msg.isFollowUp && msg.id && onFollowUpComplete) {
          onFollowUpComplete(msg.id);
        }
        setIsLoading(false);
        break;

      case 'error':
        flushStreamingBuffer();
        setError(msg.error || 'An unknown error occurred');
        setIsLoading(false);
        break;
    }
  };

  const returnValue: UsePortReturn = {
    port: portRef.current,
    streamingText,
    isLoading,
    error,
    connectionStatus,
    handleStreamResponse,
    setStreamingText,
    setIsLoading,
    setError,
    reconnect,
    sendMessage: safelySendMessage
  };

  return returnValue;
}; 