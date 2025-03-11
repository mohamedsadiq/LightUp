import { useState, useEffect } from 'react';
import { calculatePosition } from '../utils/position';
import { Storage } from "@plasmohq/storage";
import type { Mode, Settings } from '~types/settings';

// Check if we're on Reddit
const isReddit = typeof window !== 'undefined' && window.location.hostname.includes('reddit.com');

interface Position {
  x: number;
  y: number;
}

// Constants for sidebar activation
const SIDEBAR_ACTIVATION_THRESHOLD = 20; // pixels from right edge
const HOVER_DELAY = 300; // milliseconds to wait before showing sidebar

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
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);

  // Load initial mode and translation settings
  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage();
      const savedMode = await storage.get("mode") as Mode | undefined;
      const savedTranslationSettings = await storage.get("translationSettings");
      
      if (savedMode) {
        if (savedMode === "explain" || savedMode === "summarize" || 
            savedMode === "analyze" || savedMode === "translate" || savedMode === "free") {
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

  // Handle mouse movement for sidebar activation
  useEffect(() => {
    if (!isEnabled || !settings?.customization?.layoutMode || settings.customization.layoutMode !== "sidebar") {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isInteractingWithPopup) return;

      const distanceFromRight = window.innerWidth - e.clientX;
      
      if (distanceFromRight <= SIDEBAR_ACTIVATION_THRESHOLD) {
        // Clear any existing timer
        if (hoverTimer) clearTimeout(hoverTimer);
        
        // Set new timer
        const timer = setTimeout(() => {
          if (!isVisible) {
            setMode("free");
            setPosition({ x: window.innerWidth - 400, y: 0 }); // Adjust width as needed
            setIsVisible(true);
          }
        }, HOVER_DELAY);
        
        setHoverTimer(timer);
      } else {
        // Clear timer if mouse moves away
        if (hoverTimer) {
          clearTimeout(hoverTimer);
          setHoverTimer(null);
        }
        
        // Hide sidebar if not interacting
        if (isVisible && !isInteractingWithPopup && mode === "free") {
          setIsVisible(false);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [isEnabled, settings?.customization?.layoutMode, isInteractingWithPopup, isVisible, hoverTimer]);

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

      // For all modes, require text selection to show popup on click
      if (!text || !/\S/.test(text)) {
        // Only hide if we're not interacting with the popup
        if (!isInteractingWithPopup) {
          // Don't hide if we're in sidebar mode - that's handled by mouse movement
          if (!(mode === "free" && settings?.customization?.layoutMode === "sidebar")) {
            setIsVisible(false);
          }
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

      // For Reddit: ensure the popup is visible after it's created
      if (isReddit) {
        setTimeout(() => {
          const popupElement = document.querySelector('[data-plasmo-popup]');
          if (popupElement instanceof HTMLElement) {
            popupElement.style.visibility = 'visible';
          }
        }, 0);
      }

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

  // Listen for reprocessText events
  useEffect(() => {
    const handleReprocessText = (event: CustomEvent) => {
      const { mode: newMode, translationSettings: newTranslationSettings } = event.detail;
      
      // Only reprocess if we have selected text and the popup is visible
      if (selectedText && isVisible && port) {
        // Update the local mode state
        setMode(newMode);
        
        // Clear previous results
        setStreamingText?.("");
        setFollowUpQAs?.([]);
        setIsLoading?.(true);
        setError?.(null);
        
        try {
          port.postMessage({
            type: "PROCESS_TEXT",
            payload: {
              text: selectedText,
              mode: newMode,
              settings: {
                ...settings,
                translationSettings: newTranslationSettings
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
    
    window.addEventListener('reprocessText', handleReprocessText as EventListener);
    
    return () => {
      window.removeEventListener('reprocessText', handleReprocessText as EventListener);
    };
  }, [selectedText, isVisible, port, connectionId, settings, setStreamingText, setFollowUpQAs, setIsLoading, setError]);

  // Listen for openFreePopup events
  useEffect(() => {
    const handleOpenFreePopup = () => {
      // Set mode to free
      setMode("free");
      
      // Clear any existing content
      setStreamingText?.("");
      setFollowUpQAs?.([]);
      setError?.(null);
      setIsLoading?.(false);
      setSelectedText("");
      
      // Position the popup based on the layout mode
      if (settings?.customization?.layoutMode === "sidebar") {
        // Position at the right side of the screen
        setPosition({ x: window.innerWidth - 400, y: 0 });
      } else if (settings?.customization?.layoutMode === "centered") {
        // Position in the center of the screen
        setPosition({ x: (window.innerWidth / 2) - 250, y: (window.innerHeight / 2) - 200 });
      } else {
        // Default floating mode - position near the center
        const { top, left } = calculatePosition(window.innerWidth / 2, window.innerHeight / 2);
        setPosition({ x: left, y: top });
      }
      
      // Show the popup
      setIsVisible(true);
      
      // Save the mode to storage
      const storage = new Storage();
      storage.set("mode", "free").catch(console.error);
    };
    
    window.addEventListener('openFreePopup', handleOpenFreePopup);
    
    return () => {
      window.removeEventListener('openFreePopup', handleOpenFreePopup);
    };
  }, [settings, setStreamingText, setFollowUpQAs, setIsLoading, setError]);

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

    // Reset everything when switching to free mode
    if (newMode === "free") {
      setStreamingText?.("");
      setFollowUpQAs?.([]);
      setError?.(null);
      setIsLoading?.(false);
      setSelectedText("");
      setIsVisible(true);
      const { top, left } = calculatePosition(window.innerWidth / 2, window.innerHeight / 2);
      setPosition({ x: left, y: top });
      return;
    }

    // For other modes, only reprocess if there's selected text
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