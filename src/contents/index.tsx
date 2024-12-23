import { useState, useEffect, useMemo, useRef } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { motion, AnimatePresence, usePresence } from "framer-motion"
import MarkdownText from "../components/content/MarkdownText"
import { Logo, CloseIcon, PinIcon } from "../components/icons"
import "../style.css"
import { styles } from "./styles"
import { textVariants, loadingVariants, iconButtonVariants, popupVariants, tooltipVariants, feedbackButtonVariants } from "./variants"

import { useResizable } from '../hooks/useResizable';
import LoadingGif from "../assets/loading.gif"
import { PopupModeSelector } from "../components/content/PopupModeSelector"
import type { Mode } from "~types/settings"
import { v4 as uuidv4 } from 'uuid';
import { getStyles } from "./styles"
import { getTextDirection } from "~utils/rtl";

// Add this style block right after your imports
const fontImportStyle = document.createElement('style');
fontImportStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=K2D:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
  
  [dir="rtl"] {
    font-family: 'Noto Naskh Arabic', 'K2D', sans-serif;
  }
  
  [dir="ltr"] {
    font-family: 'K2D', sans-serif;
  }
  
  ::selection {
    background-color: #FFBF5A !important;
    color: #000000 !important;
  }
  
  ::-moz-selection {
    background-color: #FFBF5A !important;
    color: #000000 !important;
  }
`;
document.head.appendChild(fontImportStyle);

// This tells Plasmo to inject this component into the webpage
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Add this interface near the top of the file
interface Settings {
  modelType: "local" | "openai" | "gemini";
  serverUrl?: string;
  apiKey?: string;
  geminiApiKey?: string;
  maxTokens: number;
  customization?: {
    showSelectedText: boolean;
    theme: "light" | "dark";
    radicallyFocus: boolean;
  };
}

// Add this type definition at the top with other interfaces
interface Port extends chrome.runtime.Port {
  postMessage: (message: any) => void;
}

function Content() {
  // Add these new states after the existing useState declarations
  const [streamingText, setStreamingText] = useState("")
  const [port, setPort] = useState<Port | null>(null)
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [isExplanationComplete, setIsExplanationComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("explain")
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false)
  const storage = new Storage()
  const [followUpQAs, setFollowUpQAs] = useState<Array<{
    question: string;
    answer: string;
    id: number;
    isComplete: boolean;
  }>>([])
  const [activeAnswerId, setActiveAnswerId] = useState<number | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isInteractingWithPopup, setIsInteractingWithPopup] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isFollowUpResultVisible, setIsFollowUpResultVisible] = useState(false);
  const { width, height, handleResizeStart } = useResizable({
    initialWidth: 300,
    initialHeight: 400
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [connectionId] = useState(() => uuidv4());

  // Add this state to store the last successful result
  const [lastResult, setLastResult] = useState({
    text: "",
    explanation: "",
    isComplete: false
  });

  const currentTheme = settings?.customization?.theme || "light";
  const targetLanguage = settings?.translationSettings?.toLanguage || 'en';
  const textDirection = getTextDirection(targetLanguage);
  const themedStyles = getStyles(currentTheme, textDirection);

  // Add this near the top with other state declarations
  const [isBlurActive, setIsBlurActive] = useState(false);

  // Add new state for toast
  const [toast, setToast] = useState<{
    message: string;
    visible: boolean;
  }>({
    message: '',
    visible: false
  });

  // Add new state for enabled/disabled status
  const [isEnabled, setIsEnabled] = useState(true);

  // Add new state for speech
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Update state to track speaking state for each answer
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Add useEffect for toast auto-hide
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (toast.visible) {
      timeoutId = setTimeout(() => {
        setToast(prev => ({ ...prev, visible: false }));
      }, 2000); // Hide after 2 seconds
    }
    return () => clearTimeout(timeoutId);
  }, [toast.visible]);

  // Load the mode when component mounts
  useEffect(() => {
    const loadMode = async () => {
      const savedMode = await storage.get("mode")
      if (savedMode) {
        if (savedMode === "explain" || savedMode === "summarize" || 
            savedMode === "analyze" || savedMode === "translate") {
          setMode(savedMode)
        }
      }
    }
    loadMode()

    // Add storage listener to update mode when changed from options
    const handleStorageChange = async (changes) => {
      const newMode = await storage.get("mode")
      if (newMode) {
        if (newMode === "explain" || savedMode === "summarize" || 
            savedMode === "analyze" || savedMode === "translate") {
          setMode(newMode)
        }
      }
    }

    storage.watch({
      mode: handleStorageChange
    })

    return () => {
      storage.unwatch({
        mode: handleStorageChange
      })
    }
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      const storage = new Storage();
      const savedSettings = await storage.get("settings") as Settings | null;
      const translationSettings = await storage.get("translationSettings");
      
      console.log('📚 Loaded settings:', { savedSettings, translationSettings });
      setSettings(savedSettings);
      
      // Check if settings are properly configured based on model type
      if (savedSettings) {
        const isConfigValid = (() => {
          switch (savedSettings.modelType) {
            case "local":
              return !!savedSettings.serverUrl;
            case "openai":
              return !!savedSettings.apiKey;
            case "gemini":
              return !!savedSettings.geminiApiKey;
            case "xai":
              return !!savedSettings.xaiApiKey;
            default:
              return false;
          }
        })();

        console.log('🔧 Configuration validation:', {
          modelType: savedSettings.modelType,
          isValid: isConfigValid
        });

        setIsConfigured(isConfigValid);
      } else {
        console.log('⚠️ No settings found');
        setIsConfigured(false);
      }
    };

    loadSettings();
  }, []);

  const calculatePosition = (clientX: number, clientY: number) => {
    const padding = 20;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const popupHeight = 400; // Maximum height of our popup
    const popupWidth = 300;  // Width of our popup

    // Calculate available space below and to the right
    const spaceBelow = viewportHeight - clientY;
    const spaceRight = viewportWidth - clientX;

    // Calculate final position
    let top = clientY + padding;
    let left = clientX;

    // If not enough space below, position above
    if (spaceBelow < popupHeight + padding) {
      top = clientY - popupHeight - padding;
    }

    // If not enough space to the right, position to the left
    if (spaceRight < popupWidth + padding) {
      left = clientX - popupWidth - padding;
    }

    return {
      top: Math.max(padding, Math.min(viewportHeight - popupHeight - padding, top)),
      left: Math.max(padding, Math.min(viewportWidth - popupWidth - padding, left))
    };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.querySelector('[data-plasmo-popup]')
      if (popup && !popup.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    const handleMouseUp = async (event: MouseEvent) => {
      // If LightUp is disabled, don't do anything
      if (!isEnabled) {
        return;
      }

      const popup = document.querySelector('[data-plasmo-popup]')
      
      // If we're interacting with the popup, don't do anything
      if (isInteractingWithPopup) {
        console.log('🚫 Ignoring mouseup - interacting with popup');
        return
      }

      // If clicking inside popup, just return
      if (popup?.contains(event.target as Node)) {
        console.log('🚫 Ignoring mouseup - clicked inside popup');
        return
      }

      const selection = window.getSelection()
      console.log('📝 Selected text:', selection?.toString());
      
      // Check if there's an ongoing request
      if (port) {
        console.log('🛑 Canceling previous request');
        port.postMessage({
          type: "STOP_GENERATION",
          connectionId
        });
        
        // Don't reset states here anymore
      }

      // Check if selection contains any elements with the no-select class
      const checkSelectionForClass = () => {
        if (!selection || selection.rangeCount === 0) {
          console.log('⚠️ No selection found');
          return false;
        }
        
        const range = selection.getRangeAt(0)
        const container = document.createElement('div')
        container.appendChild(range.cloneContents())
        
        // Add logging for selection details
        console.log('🔍 Selection details:', {
          text: selection.toString(),
          rangeCount: selection.rangeCount,
          anchorNode: selection.anchorNode?.textContent,
          focusNode: selection.focusNode?.textContent
        });

        // Check if the selection or any of its parents has the no-select class
        const hasNoSelectClass = (element: Element | null): boolean => {
          while (element) {
            if (element.classList?.contains('no-select')) return true
            if (element === popup) return true
            element = element.parentElement
          }
          return false
        }

        // Check if selection is within the popup
        const isWithinPopup = (node: Node | null): boolean => {
          while (node) {
            if (node === popup) return true
            node = node.parentNode
          }
          return false
        }

        // Check both the anchor and focus nodes
        if (selection.anchorNode && (
          hasNoSelectClass(selection.anchorNode.parentElement) || 
          isWithinPopup(selection.anchorNode)
        )) return true
        
        if (selection.focusNode && (
          hasNoSelectClass(selection.focusNode.parentElement) || 
          isWithinPopup(selection.focusNode)
        )) return true
        
        return false
      }

      if (checkSelectionForClass()) {
        console.log('🚫 Selection contains no-select class');
        return;
      }

      if (!isConfigured) {
        console.log('⚠️ Extension not configured');
        setError("Please configure the extension in the options page first.");
        return;
      }

      const text = selection?.toString().trim();
      console.log('������������� Processed text:', text);

      // If there's no valid text selected but popup is visible,
      // keep showing the last result
      if (!text || !/[a-zA-Z0-9]/.test(text)) {
        if (isVisible && lastResult.text) {
          console.log('📍 Keeping last result visible');
          return;
        }
        setIsVisible(false);
        return;
      }

      // Update position and show popup
      const { top, left } = calculatePosition(event.clientX, event.clientY);
      setPosition({
        x: left,
        y: top
      });
      setIsVisible(true);
      setError(null);
      setIsLoading(true);
      setFollowUpQAs([]);
      setStreamingText('');
      setSelectedText(text);

      try {
        if (!port) {
          throw new Error('Connection not established');
        }

        const storage = new Storage();
        const translationSettings = await storage.get("translationSettings");

        console.log('📤 Sending text to process:', {
          text,
          mode,
          settings: {
            ...settings,
            translationSettings
          },
          connectionId,
          id: Date.now()
        });

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
        console.error('❌ Error processing text:', err);
        setError('Failed to process text');
        setIsLoading(false);
      }
    }

    // Add the event listeners
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [mode, isConfigured, isInteractingWithPopup, isEnabled])

 

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim() || isAskingFollowUp) return;

    console.log('Starting follow-up question:', followUpQuestion);
    setIsAskingFollowUp(true);
    const newId = Date.now();
    
    setActiveAnswerId(newId);
    
    setFollowUpQAs(prev => {
      console.log('Adding new QA with id:', newId);
      return [...prev, { 
        question: followUpQuestion, 
        answer: '', 
        id: newId,
        isComplete: false 
      }];
    });
    
    setFollowUpQuestion('');

    try {
      if (!port) {
        throw new Error('Port not connected');
      }

      console.log('Sending follow-up request:', {
        text: followUpQuestion,
        context: selectedText,
        mode,
        settings,
        isFollowUp: true,
        id: newId,
        connectionId
      });

      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: followUpQuestion,
          context: selectedText,
          mode: mode,
          settings: settings,
          isFollowUp: true,
          id: newId,
          connectionId
        }
      });
    } catch (error) {
      console.error('Follow-up error:', error);
      setError('Failed to process follow-up question');
      setFollowUpQAs(prev => prev.filter(qa => qa.id !== newId));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
    }
  };

  // Add this event listener
  document.addEventListener('mouseup', async () => {
    const selectedText = window.getSelection()?.toString()
    
    if (selectedText?.trim()) {
      try {
        // Send selected text to background script
        await chrome.runtime.sendMessage({
          type: "TEXT_SELECTED",
          payload: selectedText
        })
      } catch (error) {
        console.error("Error sending selected text:", error)
      }
    }
  })

  // Add this helper function inside the Content component
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    
    const halfLength = Math.floor(maxLength / 2);
    const start = text.slice(0, halfLength);
    const end = text.slice(-halfLength);
    
    return `${start}...${end}`;
  }

  // Update the stripHtml function to better handle HTML content
  const stripHtml = (html: string) => {
    // Create a temporary div to handle HTML entities properly
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Add this helper function to handle copying text
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const renderConfigurationWarning = () => {
    if (!isConfigured) {
      const message = settings 
        ? `Please configure your ${settings.modelType.toUpperCase()} API key in the extension options`
        : "Please configure the extension in the options page first.";
        
      return (
        <div style={styles.configurationWarning}>
          ⚠️ {message}
        </div>
      );
    }
    return null;
  };

  // Add this to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        // Recalculate position when window is resized
        const { top, left } = calculatePosition(position.x, position.y);
        setPosition({
          x: left,
          y: top
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, position]);

  // Add this useEffect to handle popup interactions
  useEffect(() => {
    const popup = document.querySelector('[data-plasmo-popup]')
    
    const handlePopupMouseEnter = () => {
      setIsInteractingWithPopup(true)
    }
    
    const handlePopupMouseLeave = () => {
      setIsInteractingWithPopup(false)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInteractingWithPopup) {
        e.stopPropagation()
      }
    }

    if (popup) {
      popup.addEventListener('mouseenter', handlePopupMouseEnter)
      popup.addEventListener('mouseleave', handlePopupMouseLeave)
      document.addEventListener('keydown', handleKeyDown, true)
    }

    return () => {
      if (popup) {
        popup.removeEventListener('mouseenter', handlePopupMouseEnter)
        popup.removeEventListener('mouseleave', handlePopupMouseLeave)
        document.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [isInteractingWithPopup]) // Re-run when visibility changes

  const handleClose = () => {
    // Send stop message to the server via port
    if (port) {
      port.postMessage({
        type: "STOP_GENERATION",
        connectionId
      });
    }
    
    setIsVisible(false);
    setIsBlurActive(false);
    setIsLoading(false);
    setError(null);
    setStreamingText('');
    setFollowUpQAs([]);
    setActiveAnswerId(null);
    setIsAskingFollowUp(false);
  };

  // Use a stable key for MarkdownText
  const explanationKey = useMemo(() => `explanation-${explanation}`, [explanation]);

  const handleModeChange = async (newMode: Mode, translationSettings?: any) => {
    console.log('🔄 Mode Change Triggered:', { 
      newMode, 
      translationSettings,
      currentText: selectedText,
      currentMode: mode 
    });

    // Fix validation for translation mode
    if (newMode === 'translate' && (!translationSettings?.toLanguage || !translationSettings?.fromLanguage)) {
      console.error('❌ Translation settings missing languages');
      setError('Translation settings are incomplete');
      return;
    }

    setMode(newMode)
    await storage.set("mode", newMode)
    
    if (translationSettings) {
      console.log('📝 Translation Settings:', {
        ...translationSettings,
        currentText: selectedText
      });
      await storage.set("translationSettings", translationSettings)
    }
    
    // Re-process text with new mode
    if (selectedText) {
      console.log('🎯 Starting text processing with new mode:', {
        text: selectedText,
        mode: newMode,
        settings: translationSettings
      });
      
      setIsLoading(true)
      setError(null)
      
      try {
        if (!port) {
          throw new Error('Port not connected');
        }

        console.log('📤 Sending to port:', {
          type: "PROCESS_TEXT",
          payload: {
            text: selectedText,
            mode: newMode,
            settings: {
              ...settings,
              translationSettings
            }
          }
        });

        port.postMessage({
          type: "PROCESS_TEXT",
          payload: {
            text: selectedText,
            mode: newMode,
            settings: {
              ...settings,
              translationSettings
            }
          }
        });

      } catch (err) {
        console.error('❌ Processing error:', err)
        setError('Failed to process text')
        setIsLoading(false)
      }
    } else {
      console.log('������️ No text selected for processing');
    }
  }

  useEffect(() => {
    const newPort = chrome.runtime.connect({ 
      name: `text-processing-${connectionId}`
    }) as Port;
    
    newPort.onMessage.addListener((message: {
      type: string;
      content?: string;
      error?: string;
      isFollowUp?: boolean;
      id?: number;
    }) => {
      console.log('📨 Port message received:', message);
      
      switch (message.type) {
        case 'chunk':
          if (message.content) {
            console.log('📝 Received chunk:', {
              content: message.content,
              isFollowUp: message.isFollowUp,
              id: message.id
            });
            
            if (message.isFollowUp && message.id) {
              setFollowUpQAs(prev => {
                const updatedQAs = prev.map(qa => 
                  qa.id === message.id
                    ? { ...qa, answer: qa.answer + message.content }
                    : qa
                );
                console.log('Updated QAs:', updatedQAs);
                return updatedQAs;
              });
            } else {
              setStreamingText(prev => prev + message.content);
            }
          }
          break;

        case 'done':
          console.log('✅ Processing completed:', {
            isFollowUp: message.isFollowUp,
            id: message.id
          });
          
          if (message.isFollowUp && message.id) {
            setFollowUpQAs(prev => {
              const updatedQAs = prev.map(qa => {
                if (qa.id === message.id) {
                  return { ...qa, isComplete: true };
                }
                return qa;
              });
              console.log('Marking QA as complete:', updatedQAs);
              return updatedQAs;
            });
            
            // Reset follow-up states
            setActiveAnswerId(null);
            setIsAskingFollowUp(false);
            console.log('Reset follow-up states');
          } else {
            setIsExplanationComplete(true);
          }
          setIsLoading(false);
          break;

        case 'error':
          console.error('❌ Stream error:', message.error);
          setError(message.error || 'An unknown error occurred');
          setIsLoading(false);
          // Also reset follow-up states on error
          setActiveAnswerId(null);
          setIsAskingFollowUp(false);
          console.log('Reset states due to error');
          break;

        default:
          console.log('Unhandled message type:', message.type);
      }
    });

    console.log('🔌 Port connected:', connectionId);
    setPort(newPort);

    return () => {
      console.log('🔌 Disconnecting port:', connectionId);
      newPort.postMessage({
        type: "STOP_GENERATION",
        connectionId
      });
      newPort.disconnect();
    };
  }, [connectionId]);

  // Add this inside the Content component, near other useEffect hooks
  useEffect(() => {
    followUpQAs.forEach(qa => {
      console.log(`Answer for question "${qa.question}":`, qa.answer);
    });
  }, [followUpQAs]);

  // Update the useEffect that handles streaming text to store the last result
  useEffect(() => {
    if (streamingText && !isLoading) {
      setLastResult({
        text: selectedText,
        explanation: streamingText,
        isComplete: true
      });
    }
  }, [streamingText, isLoading, selectedText]);

  const handleStreamResponse = (msg: any) => {
    console.log('Received message in UI:', msg);

    if (msg.type === 'error') {
      console.error('Stream error:', msg.error);
      setError(msg.error);
      setIsLoading(false);
      return;
    }

    if (msg.type === 'chunk') {
      if (msg.content) {
        console.log('Adding chunk to UI:', msg.content);
        setStreamingText(prev => {
          const newText = prev + msg.content;
          console.log('New streaming text:', newText);
          return newText;
        });
      } else {
        console.warn('Received chunk with no content:', msg);
      }
    }

    if (msg.type === 'done') {
      console.log('Stream completed');
      setIsLoading(false);
    }
  };

  // Reset streaming text when starting new request
  useEffect(() => {
    if (isLoading) {
      setStreamingText('');
    }
  }, [isLoading]);

  // Add this after other useEffect hooks
  useEffect(() => {
    if (!isVisible || !settings?.customization?.radicallyFocus) {
      setIsBlurActive(false);
      return;
    }

    setIsBlurActive(true);
  }, [isVisible, settings?.customization?.radicallyFocus]);

  // Add this right before the return statement
  useEffect(() => {
    // Create or update blur overlay
    let blurOverlay = document.getElementById('plasmo-blur-overlay');
    
    if (isBlurActive) {
      if (!blurOverlay) {
        blurOverlay = document.createElement('div');
        blurOverlay.id = 'plasmo-blur-overlay';
        document.body.appendChild(blurOverlay);
      }
      
      // Set styles for blur overlay
      Object.assign(blurOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        backgroundColor: settings?.customization?.theme === 'dark' 
          ? 'rgba(0, 0, 0, 0.7)' 
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: '2147483646', // Just below the popup
        transition: 'all 0.3s ease',
        opacity: '0'
      });

      // Animate in
      requestAnimationFrame(() => {
        if (blurOverlay) {
          blurOverlay.style.opacity = '1';
        }
      });
    } else {
      // Remove blur overlay if it exists
      if (blurOverlay) {
        blurOverlay.style.opacity = '0';
        setTimeout(() => {
          blurOverlay?.remove();
        }, 300);
      }
    }

    return () => {
      // Cleanup
      document.getElementById('plasmo-blur-overlay')?.remove();
    };
  }, [isBlurActive, settings?.customization?.theme]);

  // Update the keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Check if Ctrl+Shift is pressed
      if (e.ctrlKey && e.shiftKey) {
        let newMode: Mode | null = null;
        let translationSettings = undefined;
        let shortcutMessage = '';
        
        switch (e.key.toLowerCase()) {
          case 'x': // Toggle LightUp
            setIsEnabled(prev => !prev);
            shortcutMessage = `LightUp ${!isEnabled ? 'enabled' : 'disabled'} (Ctrl+Shift+X)`;
            e.preventDefault();
            setToast({
              message: shortcutMessage,
              visible: true
            });
            return;
          case 'z':
            newMode = 'explain';
            shortcutMessage = 'Switched to Explain mode (Ctrl+Shift+Z)';
            break;
          case 's':
            newMode = 'summarize';
            shortcutMessage = 'Switched to Summarize mode (Ctrl+Shift+S)';
            break;
          case 'a':
            newMode = 'analyze';
            shortcutMessage = 'Switched to Analyze mode (Ctrl+Shift+A)';
            break;
          case 't':
            newMode = 'translate';
            shortcutMessage = 'Switched to Translate mode (Ctrl+Shift+T)';
            translationSettings = {
              fromLanguage: 'en',
              toLanguage: 'es'
            };
            break;
        }

        if (newMode) {
          e.preventDefault();
          console.log('🎮 Keyboard shortcut triggered:', newMode, translationSettings);
          await handleModeChange(newMode, translationSettings);
          // Show toast notification
          setToast({
            message: shortcutMessage,
            visible: true
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleModeChange, isEnabled]); // Add isEnabled to dependencies

  // Add this state for voice availability
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Update the handleSpeak function
  const handleSpeak = async (text: string, id: string) => {
    try {
      // Toggle speaking state immediately for better UI feedback
      if (speakingId === id) {
        console.log('Stopping speech');
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      setSpeakingId(id);
      console.log('Starting speech for:', id);

      // Stop any current speech
      window.speechSynthesis.cancel();

      // Get voices synchronously first
      let voices = window.speechSynthesis.getVoices();
      
      // If no voices available, try to load them
      if (voices.length === 0) {
        console.log('No voices available, waiting for voices to load...');
        voices = await new Promise((resolve) => {
          const checkVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
              resolve(availableVoices);
            } else {
              setTimeout(checkVoices, 100);
            }
          };
          checkVoices();
        });
      }

      console.log('Available voices:', voices.length);

      // Select the best voice
      const preferredVoice = voices.find(voice => 
        voice.lang === 'en-US' && 
        (voice.name.includes('Samantha') || 
         voice.name.includes('Daniel') ||
         voice.name.includes('Karen') ||
         voice.name.includes('Alex'))
      ) || voices.find(voice => voice.lang === 'en-US') || voices[0];

      if (!preferredVoice) {
        throw new Error('No voice available');
      }

      console.log('Selected voice:', preferredVoice.name);

      // Clean the text
      const cleanText = stripHtml(text)
        .replace(/[*_~`]/g, '')
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.voice = preferredVoice;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Handle events
      utterance.onstart = () => {
        console.log('Speech started');
        setSpeakingId(id);
      };

      utterance.onend = () => {
        console.log('Speech ended');
        setSpeakingId(null);
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setSpeakingId(null);
      };

      // Start speaking
      console.log('Speaking text:', cleanText);
      window.speechSynthesis.speak(utterance);

      // Chrome bug workaround
      setTimeout(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 0);

    } catch (error) {
      console.error('Speech error:', error);
      setSpeakingId(null);
      window.speechSynthesis.cancel();
    }
  };

  // Update the voice loading effect
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        console.log('Voices loaded:', voices.length);
        setVoicesLoaded(true);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Chrome bug workaround
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 5000);

    return () => {
      clearInterval(keepAlive);
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              backgroundColor: settings?.customization?.theme === "dark" ? '#2C2C2C' : 'white',
              color: settings?.customization?.theme === "dark" ? 'white' : 'black',
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: 2147483647,
              fontSize: '14px',
              fontFamily: "'K2D', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
            </svg>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main popup */}
      <AnimatePresence mode="sync">
        {isVisible && (
          <motion.div 
            style={{
              // ...themedStyles.popup,
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
         
          >
            <div style={{
              ...themedStyles.popupPositioner,
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}>
              <motion.div 
                style={{
                  ...themedStyles.popup,
                  width: `${width}px`,
                  height: `${height}px`,
                  overflow: 'auto',
                  position: 'relative'
                }}
                data-plasmo-popup
                className="no-select"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsInteractingWithPopup(true)}
                onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                variants={{
                  initial: {
                    opacity: 0,
                    filter: "blur(30px)",
                    scale: 0.1,
                    transition: { duration: 0.4,  type: "spring", },
                  },
                  animate: {
                    filter: "blur(0px)",
                    opacity: 1,
                    scale: 1,
                    transition: {
                      duration: 0.4,
                      type: "spring",
                      ease: "easeInOut",
                    },
                  },
                  exit: {
                    scale: 0.5,
                    opacity: 0,
                    filter: "blur(30px)",
                    transition: {
                      type: "spring",
                      duration: 0.4,
                      ease: "easeInOut",
                    },
                  },
                }}
              >
                <div style={themedStyles.buttonContainerParent}>
                  <motion.div style={{ marginLeft: '-6px' }} layout>
                    {Logo(settings?.customization?.theme)}
                  </motion.div>
                  <PopupModeSelector 
                    activeMode={mode}
                    onModeChange={handleModeChange}
                    isLoading={isLoading}
                    theme={settings?.customization?.theme || "light"}
                  />
                  <div style={themedStyles.buttonContainer}>
                    <div style={{ position: 'relative' }}>
                      <motion.button 
                        onClick={handleClose}
                        style={{
                          ...themedStyles.button, 
                          color: settings?.customization?.theme === "dark" ? "#FFFFFF" : "#000000",
                          marginTop: '2px'
                        }}
                        variants={iconButtonVariants}
                         whileHover="hover"
                       
                      >
                        {CloseIcon()}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {settings?.customization?.showSelectedText !== false && (
                  <p style={{...themedStyles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline'}}>
                    {truncateText(selectedText)}
                  </p>
                )}

                <AnimatePresence mode="wait">
                  {isLoading && !streamingText ? (
                    <motion.div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        width: '100%',
                      }}
                      layout
                    >
                      {/* Skeleton lines */}
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={i}
                          style={{
                            height: '16px',
                            background: settings?.customization?.theme === "dark" 
                              ? 'linear-gradient(90deg, #2C2C2C 25%, #3D3D3D 50%, #2C2C2C 75%)'
                              : 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            borderRadius: '4px',
                            width: i === 2 ? '70%' : '100%',
                          }}
                          animate={{
                            backgroundPosition: ['0px', '500px'],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      ))}
                    </motion.div>
                  ) : error ? (
                    <motion.p
                      key="error"
                      style={themedStyles.error}
                      variants={textVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {error}
                    </motion.p>
                  ) : (
                    <motion.div
                      key="content"
                      variants={textVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <motion.div
                        style={themedStyles.explanation}
                        
                        initial={{  y: 50 }}
                        animate={{   y: 0 }}
                        // transition={{ type: 'spring', stiffness: 100, damping: 10, duration: 0.5 }}
                        // exit={{ opacity: 0, y: 50 }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <MarkdownText 
                            text={streamingText} 
                            isStreaming={isLoading}
                            language={targetLanguage}
                            style={{
                              opacity: isLoading ? 0.7 : 1,
                              transition: 'opacity 0.2s'
                            }}
                          />
                        </div>

                        {isExplanationComplete && (
                          <motion.div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <motion.button
                              onClick={() => handleCopy(stripHtml(streamingText), 'initial')}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                color: copiedId === 'initial' ? '#666' : '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {copiedId === 'initial' ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 62 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                                </svg>
                              )}
                            </motion.button>

                            <motion.button
                              onClick={() => handleSpeak(streamingText, 'main')}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                color: speakingId === 'main' ? '#14742F' : '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title={speakingId === 'main' ? "Stop speaking" : "Read text aloud"}
                            >
                              {speakingId === 'main' ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                                </svg>
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                      </motion.div>
                      {followUpQAs.map(({ question, answer, id, isComplete }) => (
                        <motion.div
                          key={id}
                          
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1,  y: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 10, duration: 0.5 }}
                          style={themedStyles.followUpQA}
                        >
                          
                          {/* Question bubble */}
                          <motion.div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              width: '100%'
                            }}
                          >
                            <div style={themedStyles.followUpQuestion}>
                              {question}
                            </div>
                          </motion.div>

                          {/* Answer bubble */}
                          <motion.div
                            style={{
                              display: 'flex',
                              justifyContent: 'flex-start',
                              width: '100%'
                            }}
                          >
                            <div style={themedStyles.followUpAnswer}>
                              <MarkdownText
                                text={answer}
                                isStreaming={activeAnswerId === id && !isComplete}
                                language={targetLanguage}
                                style={{
                                  margin: 10,
                                  opacity: activeAnswerId === id && !isComplete ? 0.7 : 1
                                }}
                                onMount={() => console.log('Follow-up Answer:', answer)}
                              />
                              
                              {isComplete && (
                                <motion.div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <motion.button
                                    onClick={() => handleCopy(stripHtml(answer), `followup-${id}`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      color: copiedId === `followup-${id}` ? '#666' : '#666'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {copiedId === `followup-${id}` ? (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                                      </svg>
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 62 61" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                                      </svg>
                                    )}
                                  </motion.button>

                                  <motion.button
                                    onClick={() => handleSpeak(answer, `followup-${id}`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      color: speakingId === `followup-${id}` ? '#14742F' : '#666'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title={speakingId === `followup-${id}` ? "Stop speaking" : "Read text aloud"}
                                  >
                                    {speakingId === `followup-${id}` ? (
                                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                                      </svg>
                                    ) : (
                                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                                      </svg>
                                    )}
                                  </motion.button>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}
                      
                      {/* Input section */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={themedStyles.followUpInputContainer}
                      >
                        <div style={themedStyles.searchContainer}>
                          <input
                            type="text"
                            value={followUpQuestion}
                            onChange={(e) => setFollowUpQuestion(e.target.value)}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              
                              if (e.key === 'Enter') {
                                handleAskFollowUp();
                              }
                            }}
                            onKeyUp={(e) => e.stopPropagation()}
                            onKeyPress={(e) => e.stopPropagation()}
                            placeholder="Ask a follow-up question..."
                            style={themedStyles.input}
                            disabled={isAskingFollowUp}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                          />
                          <motion.button
                            onClick={handleAskFollowUp}
                            disabled={!followUpQuestion.trim() || isAskingFollowUp}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={themedStyles.searchSendButton}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '15px',
                    height: '15px',
                    cursor: 'se-resize',
                    background: 'transparent'
                  }}
                  onMouseDown={handleResizeStart}
                  className="resize-handle"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Content
