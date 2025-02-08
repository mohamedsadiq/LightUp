import { useState, useEffect } from 'react';
import { calculatePosition } from '../utils/position';
import { Storage } from "@plasmohq/storage";
import type { Mode } from '~types/settings';
import type { Settings } from '~types/settings';

interface Position {
  x: number;
  y: number;
}

interface UsePopupReturn {
  isVisible: boolean;
  position: Position;
  selectedText: string;
  isBlurActive: boolean;
  isInteractingWithPopup: boolean;
  isInputFocused: boolean;
  mode: Mode;
  handleClose: () => void;
  handleModeChange: (newMode: Mode, translationSettings?: any) => Promise<void>;
  setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
  setPosition: React.Dispatch<React.SetStateAction<Position>>;
  setIsInteractingWithPopup: React.Dispatch<React.SetStateAction<boolean>>;
  setIsInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedText: React.Dispatch<React.SetStateAction<string>>;
}

export const usePopup = (
  port: chrome.runtime.Port | null,
  connectionId: string,
  radicallyFocus?: boolean,
  isEnabled?: boolean,
  settings?: Settings | null,
  setIsLoading?: (value: boolean) => void,
  setError?: (value: string | null) => void,
  setStreamingText?: (value: string) => void,
  setFollowUpQAs?: React.Dispatch<React.SetStateAction<any[]>>
): UsePopupReturn => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [isBlurActive, setIsBlurActive] = useState(false);
  const [isInteractingWithPopup, setIsInteractingWithPopup] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [mode, setMode] = useState<Mode>("explain");

  // Load initial mode and translation settings
  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage();
      const savedMode = await storage.get("mode") as Mode | undefined;
      const savedTranslationSettings = await storage.get("translationSettings");
      
      if (savedMode) {
        if (savedMode === "explain" || savedMode === "summarize" || 
            savedMode === "analyze" || savedMode === "translate") {
          setMode(savedMode);
          
          // If we're in translate mode, ensure we have translation settings
          if (savedMode === "translate" && !savedTranslationSettings) {
            await storage.set("translationSettings", {
              fromLanguage: "en",
              toLanguage: "es"
            });
          }
        }
      }
    };
    loadSettings();
  }, []);

  // Handle text selection
  useEffect(() => {
    const handleSelection = async (event: MouseEvent) => {
      if (!isEnabled) return;
      
      // Don't process if we're interacting with the popup
      if (isInteractingWithPopup) return;

      const popup = document.querySelector('[data-plasmo-popup]');
      if (popup?.contains(event.target as Node)) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || !/\S/.test(text)) {
        // Only hide if we're not interacting with the popup
        if (!isInteractingWithPopup) {
          setIsVisible(false);
        }
        return;
      }

      // Clear previous results
      setStreamingText?.("");
      setFollowUpQAs?.([]);
      setError?.(null);

      // Calculate position and show popup
      const { top, left } = calculatePosition(event.clientX, event.clientY);
      setPosition({ x: left, y: top });
      setSelectedText(text);
      setIsVisible(true);
      setIsLoading?.(true);

      try {
        if (!port) {
          throw new Error('Connection not established');
        }

        const storage = new Storage();
        const translationSettings = await storage.get("translationSettings");

        port.postMessage({
          type: "PROCESS_TEXT",
          payload: {
            text,
            mode,
            settings: {
              ...settings,
              translationSettings
            },
            connectionId,
            id: Date.now()
          }
        });
      } catch (err) {
        setError?.('Failed to process text');
        setIsLoading?.(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [isEnabled, isInteractingWithPopup, mode, settings, port, connectionId]);

  // Handle blur effect
  useEffect(() => {
    if (!isVisible || !radicallyFocus) {
      setIsBlurActive(false);
      return;
    }
    setIsBlurActive(true);
  }, [isVisible, radicallyFocus]);

  const handleClose = () => {
    if (port) {
      port.postMessage({
        type: "STOP_GENERATION",
        connectionId
      });
    }
    
    setIsVisible(false);
    setIsBlurActive(false);
    setSelectedText("");
    setStreamingText?.("");
    setFollowUpQAs?.([]);
    setIsInteractingWithPopup(false);
    setIsInputFocused(false);
    setError?.(null);
    setIsLoading?.(false);
  };

  const handleModeChange = async (newMode: Mode, translationSettings?: any) => {
    setMode(newMode);
    const storage = new Storage();
    await storage.set("mode", newMode);
    
    if (translationSettings) {
      await storage.set("translationSettings", translationSettings);
    }

    // If there's selected text, reprocess it with the new mode
    if (selectedText && isVisible) {
      setStreamingText?.("");
      setFollowUpQAs?.([]);
      setIsLoading?.(true);
      setError?.(null);

      try {
        if (!port) {
          throw new Error('Connection not established');
        }

        port.postMessage({
          type: "PROCESS_TEXT",
          payload: {
            text: selectedText,
            mode: newMode,
            settings: {
              ...settings,
              translationSettings
            },
            connectionId,
            id: Date.now()
          }
        });
      } catch (err) {
        setError?.('Failed to process text');
        setIsLoading?.(false);
      }
    }
  };

  return {
    isVisible,
    position,
    selectedText,
    isBlurActive,
    isInteractingWithPopup,
    isInputFocused,
    mode,
    handleClose,
    handleModeChange,
    setIsVisible,
    setPosition,
    setIsInteractingWithPopup,
    setIsInputFocused,
    setSelectedText
  };
}; 