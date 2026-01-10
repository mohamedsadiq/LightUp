import { useState, useEffect } from 'react';
import { calculatePosition, calculateFloatingPosition } from '../utils/position';
import { Storage } from "@plasmohq/storage";
import type { Mode, Settings } from '~types/settings';
import { getHighlightColor } from '~utils/highlight';
import type { FollowUpQA } from "~types/followup";
import { cleanTextForMode } from '~utils/textProcessing';
import { unifiedAIService } from '~services/llm/UnifiedAIService';

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
  calculateViewportAwarePosition: (clientX: number, clientY: number, dimensions?: { width: number; height: number }) => void;
}

export const usePopup = (
  port: chrome.runtime.Port | null,
  connectionId: string,
  radicallyFocus: boolean | undefined,
  isEnabled: boolean,
  settings: Settings | null,
  setIsLoading?: (loading: boolean) => void,
  setError?: (error: string | null) => void,
  setStreamingText?: (text: string) => void,
  setFollowUpQAs?: (qas: FollowUpQA[]) => void,
  setPort?: (port: chrome.runtime.Port | null) => void
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

    // Remove the mouse movement event listener and related code
    return () => {
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
      let text = selection?.toString().trim();

      // Apply text cleaning based on the current mode
      if (text) {
        text = cleanTextForMode(text, mode);
      }

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

      // Apply persistent highlighting if enabled
      if (settings?.customization?.persistHighlight && selection) {
        try {
          // Get the highlight color from settings
          const highlightColor = settings?.customization?.highlightColor || 'default';
          const color = getHighlightColor(highlightColor);
          
          // Create a custom event to trigger highlighting
          const highlightEvent = new CustomEvent('applyHighlight', { 
            detail: { 
              selection,
              color
            } 
          });
          window.dispatchEvent(highlightEvent);
        } catch (e) {
          console.error("Failed to highlight selection:", e);
        }
      }

      // Check for automatic activation using either the boolean flag or the mode setting
      const isAutomaticActivation = settings?.customization?.automaticActivation === true || 
                                    settings?.customization?.activationMode === "automatic";
      
      if (!isAutomaticActivation) {
        // In manual mode, just save the selected text but don't show popup
        setSelectedText(text);
        return;
      }

      // Clear previous results
      setStreamingText?.("");
      setFollowUpQAs?.([]);
      setError?.(null);

      // Calculate position and show popup for floating mode
      // Use enhanced positioning for floating mode, fallback to legacy for others
      if (settings?.customization?.layoutMode === "floating") {
        const { top, left } = calculateFloatingPosition(
          event.clientX, 
          event.clientY, 
          { width: 350, height: 460 }, // Default dimensions, will be updated by content component
          { margin: settings?.customization?.popupMargin || 8 }
        );
        setPosition({ x: left, y: top });
      } else {
        // Legacy positioning for sidebar and centered modes
        const { top, left } = calculatePosition(event.clientX, event.clientY);
        setPosition({ x: left, y: top });
      }
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

        const settingsToSend = {
          ...settings,
          translationSettings
        };

        port.postMessage({
          type: "PROCESS_TEXT",
          payload: {
            text,
            mode,
            settings: settingsToSend,
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

  // Handle context menu text processing
  useEffect(() => {
    const handleContextMenuSelection = async (event: CustomEvent) => {
      if (!isEnabled) return;
      
      let text = event.detail?.text || '';
      if (!text) return;

      // Apply text cleaning based on the current mode
      text = cleanTextForMode(text, mode);
      if (!text) return;

      // Check if we're in manual mode and this is not from the context menu
      if (settings?.customization?.activationMode === "manual" && !event.detail?.fromContextMenu) {
        // In manual mode, we only process text from the context menu
        return;
      }

      // Apply persistent highlighting if enabled
      if (settings?.customization?.persistHighlight && window.getSelection()) {
        try {
          // Get the highlight color from settings
          const highlightColor = settings?.customization?.highlightColor || 'default';
          const color = getHighlightColor(highlightColor);
          
          // Create a custom event to trigger highlighting
          const highlightEvent = new CustomEvent('applyHighlight', { 
            detail: { 
              selection: window.getSelection(),
              color
            } 
          });
          window.dispatchEvent(highlightEvent);
        } catch (e) {
          console.error("Failed to highlight selection:", e);
        }
      }

      // Clear previous results
      setStreamingText?.("");
      setFollowUpQAs?.([]);
      setError?.(null);

      // Calculate position based on mouse position or center of screen if not available
      // Use enhanced positioning for floating mode
      const mouseX = event.detail?.x || window.innerWidth / 2;
      const mouseY = event.detail?.y || window.innerHeight / 2;
      
      if (settings?.customization?.layoutMode === "floating") {
        const { top, left } = calculateFloatingPosition(
          mouseX, 
          mouseY, 
          { width: 350, height: 460 },
          { margin: settings?.customization?.popupMargin || 8 }
        );
        setPosition({ x: left, y: top });
      } else {
        const { top, left } = calculatePosition(mouseX, mouseY);
        setPosition({ x: left, y: top });
      }
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

    // Listen for context menu events
    window.addEventListener('contextMenuSelection', handleContextMenuSelection as EventListener);
    return () => window.removeEventListener('contextMenuSelection', handleContextMenuSelection as EventListener);
  }, [isEnabled, mode, settings, port, connectionId]);

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
        // For free mode, we don't have a selection, so this will use the fallback positioning
        if (settings?.customization?.layoutMode === "floating") {
          const { top, left } = calculateFloatingPosition(
            window.innerWidth / 2, 
            window.innerHeight / 2,
            { width: 350, height: 460 },
            { margin: settings?.customization?.popupMargin || 8 }
          );
          setPosition({ x: left, y: top });
        } else {
          const { top, left } = calculatePosition(window.innerWidth / 2, window.innerHeight / 2);
          setPosition({ x: left, y: top });
        }
      }
      
      // Show the popup
      setIsVisible(true);
      
      // Save the mode to storage
      const storage = new Storage();
      storage.set("mode", "free").catch(console.error);
    };
    
    const handleOpenFreePopupWithContext = (event: CustomEvent) => {
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
        if (settings?.customization?.layoutMode === "floating") {
          const { top, left } = calculateFloatingPosition(
            window.innerWidth / 2, 
            window.innerHeight / 2,
            { width: 350, height: 460 },
            { margin: settings?.customization?.popupMargin || 8 }
          );
          setPosition({ x: left, y: top });
        } else {
          const { top, left } = calculatePosition(window.innerWidth / 2, window.innerHeight / 2);
          setPosition({ x: left, y: top });
        }
      }
      
      // Show the popup
      setIsVisible(true);
      
      // Save the mode to storage
      const storage = new Storage();
      storage.set("mode", "free").catch(console.error);
      
      // Log the page context for debugging
      if (event.detail) {
        console.log('🚀 Free mode opened with page context:', {
          title: event.detail.pageTitle,
          url: event.detail.pageUrl,
          contentLength: event.detail.pageContent?.length || 0
        });
      }
    };

    window.addEventListener('openFreePopup', handleOpenFreePopup);
    window.addEventListener('openFreePopupWithContext', handleOpenFreePopupWithContext as EventListener);
    
    return () => {
      window.removeEventListener('openFreePopup', handleOpenFreePopup);
      window.removeEventListener('openFreePopupWithContext', handleOpenFreePopupWithContext as EventListener);
    };
  }, [settings, setStreamingText, setFollowUpQAs, setIsLoading, setError]);

  const handleClose = () => {
    // Clear session memory to ensure privacy
    unifiedAIService.clearContext();
    
    if (port) {
      try {
        port.postMessage({
          type: "STOP_GENERATION",
          connectionId
        });
        port.disconnect();
      } catch (err) {
        console.error('Error disconnecting port:', err);
      }
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

  // Add effect to clear memory when popup is hidden
  useEffect(() => {
    if (!isVisible) {
      // Clear memory when popup becomes invisible
      unifiedAIService.clearContext();
    }
  }, [isVisible]);

  // Add effect to maintain connection while popup is visible
  useEffect(() => {
    if (isVisible && !port) {
      // Reconnect if popup is visible but we don't have a port
      const storage = new Storage();
      storage.get("settings").then(settings => {
        try {
          const newPort = chrome.runtime.connect({ 
            name: `text-processing-${connectionId}`
          });
          setPort(newPort);
        } catch (err) {
          console.error('Failed to reconnect port:', err);
          setError?.('Connection failed. Please try again.');
        }
      });
    }
  }, [isVisible, port]);

  const calculateViewportAwarePosition = (clientX: number, clientY: number, dimensions = { width: 350, height: 460 }) => {
    if (settings?.customization?.layoutMode === "floating") {
      const { top, left } = calculateFloatingPosition(
        clientX, 
        clientY, 
        dimensions,
        { margin: settings?.customization?.popupMargin || 8 }
      );
      setPosition({ x: left, y: top });
    } else {
      // Legacy positioning for other modes
      const { top, left } = calculatePosition(clientX, clientY);
      setPosition({ x: left, y: top });
    }
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
      // For free mode, we don't have a selection, so this will use the fallback positioning
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
    setSelectedText,
    calculateViewportAwarePosition
  };
}; 