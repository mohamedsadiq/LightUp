import { useState, useEffect } from 'react';

interface PortMessage {
  type: string;
  content?: string;
  error?: string;
  isFollowUp?: boolean;
  id?: number;
}

interface UsePortReturn {
  port: chrome.runtime.Port | null;
  streamingText: string;
  isLoading: boolean;
  error: string | null;
  handleStreamResponse: (msg: PortMessage) => void;
  setStreamingText: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
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

  useEffect(() => {
    const newPort = chrome.runtime.connect({ 
      name: `text-processing-${connectionId}`
    });
    
    newPort.onMessage.addListener((message: PortMessage) => {
      handleStreamResponse(message);
    });

    setPort(newPort);

    return () => {
      newPort.postMessage({
        type: "STOP_GENERATION",
        connectionId
      });
      newPort.disconnect();
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
    port,
    streamingText,
    isLoading,
    error,
    handleStreamResponse,
    setStreamingText,
    setIsLoading,
    setError
  };
}; 