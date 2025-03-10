import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { motion, AnimatePresence } from "framer-motion"
import type { MotionStyle } from "framer-motion"
import type { CSSProperties } from "react"
import MarkdownText from "../components/content/MarkdownText"
import { Logo, CloseIcon } from "../components/icons"
import "./styles.css"
import "./content-style.css"
import "./tailwind-scoped.css"
import { styles } from "./styles"
import { textVariants, iconButtonVariants } from "./variants"
import { useResizable } from '../hooks/useResizable'
import { PopupModeSelector } from "../components/content/PopupModeSelector"
import { v4 as uuidv4 } from 'uuid'
import { getStyles } from "./styles"
import { getTextDirection } from "~utils/rtl"
import { truncateText } from "~utils/textProcessing"
import { flexMotionStyle, scaleMotionVariants, fadeMotionVariants, noMotionVariants, toastMotionVariants } from "~styles/motionStyles"
import type { Theme } from "~types/theme"
import { applyHighlightColor } from "~utils/highlight"
import { calculatePosition } from "~utils/position"
import { Storage } from "@plasmohq/storage"
import { Z_INDEX } from "~utils/constants"
import { THEME_COLORS } from "~utils/constants"
import { loadingSkeletonVariants, shimmerVariants, loadingVariants } from "~contents/variants"
import { getHighlightColor } from "~utils/highlight"
import ErrorMessage from "~components/common/ErrorMessage"

// Import our hooks
import { useSpeech } from "~hooks/useSpeech"
import { useToast } from "~hooks/useToast"
import { useEnabled } from "~hooks/useEnabled"
import { useFollowUp } from "~hooks/useFollowUp"
import { useSettings } from "~hooks/useSettings"
import { useKeyboardShortcuts } from "~hooks/useKeyboardShortcuts"
import { usePort } from "~hooks/usePort"
import { usePopup } from "~hooks/usePopup"
import { useCopy } from "~hooks/useCopy"
import { useLastResult } from "~hooks/useLastResult"
import { useCurrentModel } from "~hooks/useCurrentModel"
import { useConversation } from "~hooks/useConversation"
import { useMode } from "~hooks/useMode"

// Add message listener for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SETTINGS_UPDATED") {
    // Force a refresh of the settings in the content script
    const storage = new Storage();
    storage.set("settings", message.settings).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('settingsUpdated', { 
        detail: { 
          key: message.key,
          value: message.value,
          settings: message.settings
        } 
      });
      window.dispatchEvent(event);
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === "MODES_UPDATED") {
    // Force a refresh of the settings and preferred modes in the content script
    const storage = new Storage();
    
    // Update settings with new preferred modes
    storage.set("settings", message.settings).then(() => {
      // Also update the preferredModes in storage
      return storage.set("preferredModes", message.preferredModes);
    }).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('modesUpdated', { 
        detail: { 
          preferredModes: message.preferredModes,
          settings: message.settings
        } 
      });
      window.dispatchEvent(event);
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  if (message.type === "MODE_CHANGED") {
    // Update the active mode in storage
    const storage = new Storage();
    
    // Update the mode
    storage.set("mode", message.mode).then(() => {
      // If it's translate mode, also update translation settings
      if (message.mode === "translate" && message.translationSettings) {
        return storage.set("translationSettings", message.translationSettings);
      }
      return Promise.resolve();
    }).then(() => {
      // Dispatch a custom event that our hooks can listen for
      const event = new CustomEvent('modeChanged', { 
        detail: { 
          mode: message.mode,
          translationSettings: message.translationSettings,
          reprocessExisting: message.reprocessExisting
        } 
      });
      window.dispatchEvent(event);
      
      // Send response to confirm receipt
      sendResponse({ success: true });
    });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
});

// Add CSS reset to prevent Tailwind base styles from affecting the webpage
const cssResetStyle = document.createElement('style');
cssResetStyle.textContent = `
  /* Reset styles for LightUp components */
  [data-plasmo-popup] button,
  [data-plasmo-popup] input,
  [data-plasmo-popup] select,
  [data-plasmo-popup] textarea {
    all: revert;
    font-family: 'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 100%;
    line-height: 1.15;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
  }

  /* Ensure our buttons have pointer cursor */
  [data-plasmo-popup] button,
  [data-plasmo-popup] [role="button"] {
    cursor: pointer;
  }
`;
document.head.appendChild(cssResetStyle);

// Add font import
const fontImportStyle = document.createElement('style');
fontImportStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=K2D:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
`;
document.head.appendChild(fontImportStyle);

// Plasmo config
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Add a specific fix for Reddit's CSS that hides custom elements
const isReddit = window.location.hostname.includes('reddit.com');
if (isReddit) {
  // Create a style element to override Reddit's CSS
  const redditFixStyle = document.createElement('style');
  redditFixStyle.textContent = `
    /* Override Reddit's CSS that hides undefined custom elements */
    plasmo-csui, 
    [data-plasmo-popup],
    .grecaptcha-badge, 
    :not(:defined):not(faceplate-auto-height-animator,faceplate-dropdown-menu,faceplate-expandable-section-helper,faceplate-hovercard,faceplate-tracker) {
      visibility: visible !important;
    }
  `;
  document.head.appendChild(redditFixStyle);
  
  // Add a MutationObserver to ensure our elements remain visible
  // even if Reddit's DOM changes
  const observer = new MutationObserver((mutations) => {
    const plasmoElements = document.querySelectorAll('plasmo-csui, [data-plasmo-popup]');
    plasmoElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.visibility = 'visible';
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
}

const loadingIndicatorContainerStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'center',
  alignItems: 'center',
  marginTop: '8px',
  gap: '8px'
};

// Define a type for our flex container style
type FlexContainerStyle = {
  display: 'flex'
  flexDirection: 'row'
  justifyContent: 'flex-start' | 'flex-end'
  width: string
}

// Create properly typed style objects
const questionBubbleStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
  width: '100%'
};

const answerBubbleStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-start' as const,
  width: '100%',
  lineHeight: '13px'
};

function Content() {
  // Generate a stable connection ID
  const [connectionId] = useState(() => uuidv4());
  const [highlightedRanges, setHighlightedRanges] = useState<Range[]>([]);
  
  // Add ref for the input element
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use our custom hooks
  const { settings, setSettings, isConfigured, currentTheme, targetLanguage, fontSize } = useSettings();
  const { activeMode, preferredModes, translationSettings } = useMode();

  // Add effect to ensure visibility on Reddit
  useEffect(() => {
    if (isReddit) {
      const ensureVisibility = () => {
        const popupElement = document.querySelector('[data-plasmo-popup]');
        if (popupElement instanceof HTMLElement) {
          popupElement.style.visibility = 'visible';
        }
      };
      
      // Apply immediately and after a short delay to ensure it works
      ensureVisibility();
      const timeoutId = setTimeout(ensureVisibility, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // Initialize all our hooks
  const { width, height, handleResizeStart } = useResizable({
    initialWidth: 350,
    initialHeight: 460
  });

  const { toast, showToast } = useToast();
  const { isEnabled, handleEnabledChange } = useEnabled(showToast);
  const { voicesLoaded, speakingId, handleSpeak } = useSpeech();
  const { copiedId, handleCopy } = useCopy();
  const { lastResult, updateLastResult } = useLastResult();
  const currentModel = useCurrentModel();

  const {
    conversationContext,
    updateConversation,
    clearConversation
  } = useConversation();

  const handleRegenerate = async () => {
    if (!selectedText || isLoading) return;
    
    setIsLoading(true);
    setStreamingText('');
    setError(null);

    try {
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: selectedText,
          context: "",
          pageContext: "",
          mode: mode,
          settings: settings,
          isFollowUp: false,
          id: Date.now(),
          connectionId
        }
      });
    } catch (err) {
      setError("Failed to regenerate response. Please try again.");
      setIsLoading(false);
    }
  };

  const handleRegenerateFollowUp = async (question: string, id: number) => {
    if (isAskingFollowUp) return;
    
    setIsAskingFollowUp(true);
    setActiveAnswerId(id);
    
    // Clear the previous answer
    setFollowUpQAs(prev => prev.map(qa =>
      qa.id === id ? { ...qa, answer: '', isComplete: false } : qa
    ));

    try {
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: question,
          context: selectedText,
          pageContext: "",
          mode: mode,
          settings: settings,
          isFollowUp: true,
          id: id,
          connectionId
        }
      });
    } catch (err) {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, isComplete: true } : qa
      ));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      setError('Failed to regenerate follow-up response');
    }
  };

  // Add debug logging for model
  useEffect(() => {
    console.log("[Content] Current model:", currentModel);
  }, [currentModel]);

  // Remove context refresh effect and add simple mount effect
  useEffect(() => {
    
  }, [isEnabled]);

  // Initialize followUpQAs state first
  const {
    followUpQAs,
    followUpQuestion,
    isAskingFollowUp,
    activeAnswerId,
    handleFollowUpQuestion,
    setFollowUpQAs,
    setFollowUpQuestion,
    setActiveAnswerId,
    setIsAskingFollowUp
  } = useFollowUp();

  const {
    port,
    streamingText,
    isLoading,
    error,
    setStreamingText,
    setIsLoading,
    setError
  } = usePort(
    connectionId,
    (id, content) => {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, answer: qa.answer + content } : qa
      ));
    },
    (id) => {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, isComplete: true } : qa
      ));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      
      // Add auto-focus to the input field after response is complete
      setTimeout(() => {
        // Try to focus using the ref first
        if (inputRef.current) {
          inputRef.current.focus();
        } else {
          // Fallback to querySelector if ref is not available
          const inputElement = document.querySelector('[data-plasmo-popup] input[type="text"]');
          if (inputElement instanceof HTMLInputElement) {
            inputElement.focus();
          }
        }
      }, 100);
    }
  );

  const {
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
  } = usePopup(
    port, 
    connectionId, 
    settings?.customization?.radicallyFocus,
    isEnabled,
    settings,
    setIsLoading,
    setError,
    setStreamingText,
    setFollowUpQAs
  );

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    isEnabled,
    handleEnabledChange,
    handleModeChange,
    settings,
    setSettings,
    showToast
  });

  // Add a ref for the popup element
  const popupRef = useRef<HTMLDivElement>(null);

  // Enhanced scroll function
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const popup = popupRef.current;
      if (popup) {
        const scrollHeight = popup.scrollHeight;
        const height = popup.clientHeight;
        const maxScroll = scrollHeight - height;
        
        popup.scrollTo({
          top: maxScroll,
          behavior: 'smooth'
        });
      }
    }, 100); // Small delay to ensure content is rendered
  }, []);

  // Scroll on new question or answer updates
  useEffect(() => {
    scrollToBottom();
  }, [followUpQAs, activeAnswerId, isAskingFollowUp]);

  // Wrap handleAskFollowUp to include necessary context
  const handleAskFollowUpWrapper = () => {
    if (!port || !followUpQuestion.trim() || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    const newId = Date.now();
    
    setActiveAnswerId(newId);
    
    setFollowUpQAs(prev => [
      ...prev,
      { 
        question: followUpQuestion, 
        answer: '', 
        id: newId,
        isComplete: false 
      }
    ]);

    // Update conversation context with the new question
    updateConversation(followUpQuestion);

    try {
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: followUpQuestion,
          context: mode === "free" ? "" : selectedText,
          conversationContext, // Add conversation context
          mode: mode,
          settings: settings,
          isFollowUp: true,
          id: newId,
          connectionId
        }
      });

      setFollowUpQuestion("");
      
      // Keep focus on the input field after submitting
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      setFollowUpQAs(prev => prev.filter(qa => qa.id !== newId));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      setError('Failed to process question');
    }
  };

  // Get themed styles
  const textDirection = getTextDirection(targetLanguage);
  const themedStyles = getStyles(currentTheme, textDirection, fontSize);

  // Update last result when streaming completes
  useMemo(() => {
    if (streamingText && !isLoading) {
      updateLastResult(selectedText, streamingText, true);
    }
  }, [streamingText, isLoading, selectedText]);

  // Update the highlight color effect
  useEffect(() => {
    // Apply highlight color when settings or enabled state changes
    const cleanup = applyHighlightColor(settings?.customization?.highlightColor, isEnabled);

    // Watch for settings changes
    const storage = new Storage();
    const handleSettingsChange = async () => {
      const newSettings = await storage.get("settings") as typeof settings;
      if (newSettings?.customization?.highlightColor !== settings?.customization?.highlightColor) {
        cleanup();
        applyHighlightColor(newSettings?.customization?.highlightColor, isEnabled);
      }
    };

    storage.watch({
      settings: handleSettingsChange
    });

    return () => {
      cleanup();
      storage.unwatch({
        settings: handleSettingsChange
      });
    };
  }, [isEnabled, settings?.customization?.highlightColor]);

  // Add this effect after the other useEffects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.querySelector('[data-plasmo-popup]');
      // Only close if clicking outside the popup
      if (popup && !popup.contains(event.target as Node)) {
        setIsVisible(false);
        setIsInteractingWithPopup(false);
        setIsInputFocused(false);
        setSelectedText("");
        setStreamingText?.("");
        setFollowUpQAs?.([]);
        setError?.(null);
        setIsLoading?.(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [setIsVisible, setIsInteractingWithPopup, setIsInputFocused, setSelectedText, setStreamingText, setFollowUpQAs, setError, setIsLoading]);

  // Add function to apply highlight to a range
  const applyHighlightToRange = (range: Range, color: string) => {
    const span = document.createElement('span');
    span.className = 'lightup-highlight';
    span.style.backgroundColor = color;
    range.surroundContents(span);
    return span;
  };

  // Add function to remove highlights
  const removeHighlights = () => {
    const highlights = document.querySelectorAll('.lightup-highlight');
    highlights.forEach(highlight => {
      const parent = highlight.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(highlight.textContent || ''), highlight);
        parent.normalize();
      }
    });
    setHighlightedRanges([]);
  };

  // Modify handleSelection to handle persistent highlighting
  const handleSelection = async (event: MouseEvent) => {
    if (!isEnabled) return;
    
    // Check if the click is inside the popup
    const popup = document.querySelector('[data-plasmo-popup]');
    if (popup?.contains(event.target as Node)) {
      return;
    }
    
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      return;
    }

    // Calculate position
    const { top, left } = calculatePosition(event.clientX, event.clientY);
    setPosition({ x: left, y: top });
    setSelectedText(text);
    setIsVisible(true);
    
    // For Reddit: ensure the popup is visible after it's created
    if (isReddit) {
      setTimeout(() => {
        const popupElement = document.querySelector('[data-plasmo-popup]');
        if (popupElement instanceof HTMLElement) {
          popupElement.style.visibility = 'visible';
        }
      }, 0);
    }
  };

  // Add cleanup effect for highlights when settings change
  useEffect(() => {
    if (!settings?.customization?.persistHighlight) {
      removeHighlights();
    }
  }, [settings?.customization?.persistHighlight]);

  // Add cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      removeHighlights();
    };
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [isEnabled, isInteractingWithPopup, mode, settings, port, connectionId]);

  // Update conversation when receiving response
  useEffect(() => {
    if (streamingText && !isLoading) {
      updateConversation(selectedText, streamingText);
    }
  }, [streamingText, isLoading, selectedText, updateConversation]);

  // Clear conversation when closing popup
  useEffect(() => {
    if (!isVisible) {
      clearConversation();
    }
  }, [isVisible, clearConversation]);

  // Helper function to render popup content
  const renderPopupContent = () => (
    <>
      {/* Header */}
      <div style={themedStyles.buttonContainerParent}>
        <motion.div style={{ marginLeft: '-6px' }} layout>
          {Logo(currentTheme)}
        </motion.div>
        <PopupModeSelector 
          activeMode={mode}
          onModeChange={handleModeChange}
          isLoading={isLoading}
          theme={currentTheme}
        />
        <div style={themedStyles.buttonContainer}>
          <motion.button 
            onClick={handleClose}
            style={{
              ...themedStyles.button,
              marginTop: '2px'
            }}
            variants={iconButtonVariants}
            whileHover="hover"
          >
            <CloseIcon theme={currentTheme} />
          </motion.button>
        </div>
      </div>

      {/* Selected Text */}
      {settings?.customization?.showSelectedText !== false && mode !== "free" && (
        <p style={{...themedStyles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline'}}>
          {truncateText(selectedText)}
        </p>
      )}

      {/* Welcome Message for Free Mode */}
      {mode === "free" && !streamingText && !error && followUpQAs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            ...themedStyles.explanation,
            textAlign: 'center',
            padding: '20px',
            marginBottom: '20px',
            background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
            border: `1px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <motion.div
            style={{
              fontSize: '24px',
              marginBottom: '10px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            👋
          </motion.div>
          <motion.h2
            style={{
              fontSize: '1.2em',
              fontWeight: 600,
              marginBottom: '8px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            Welcome to LightUp
          </motion.h2>
          <motion.p
            style={{
              fontSize: '0.9em',
              color: currentTheme === "dark" ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              lineHeight: '1.5'
            }}
          >
            Ask me anything! I'm here to help with any questions you have.
          </motion.p>
        </motion.div>
      )}

      {/* Guidance Message for Other Modes */}
      {mode !== "free" && !selectedText && !streamingText && !error && followUpQAs.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            ...themedStyles.explanation,
            textAlign: 'center',
            padding: '20px',
            marginBottom: '20px',
            background: currentTheme === "dark" ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
            borderRadius: '12px',
            border: `1px solid ${currentTheme === "dark" ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <motion.div
            style={{
              fontSize: '24px',
              marginBottom: '10px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            {mode === "explain" ? "📝" : mode === "summarize" ? "📋" : mode === "analyze" ? "🔍" : "🌐"}
          </motion.div>
          <motion.h2
            style={{
              fontSize: '1.2em',
              fontWeight: 600,
              marginBottom: '8px',
              color: currentTheme === "dark" ? '#fff' : '#000'
            }}
          >
            Select Text to {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </motion.h2>
          <motion.p
            style={{
              fontSize: '0.9em',
              color: currentTheme === "dark" ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
              lineHeight: '1.5'
            }}
          >
            {mode === "explain" && "Select any text you'd like me to explain in detail."}
            {mode === "summarize" && "Select any text you'd like me to summarize for you."}
            {mode === "analyze" && "Select any text you'd like me to analyze in depth."}
            {mode === "translate" && "Select any text you'd like me to translate."}
          </motion.p>
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {isLoading && !streamingText ? (
          <motion.div 
            style={flexMotionStyle} 
            variants={loadingSkeletonVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            layout
          >
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                style={{
                  height: '24px',
                  background: currentTheme === "dark" 
                    ? 'linear-gradient(90deg, #2C2C2C 0%, #3D3D3D 50%, #2C2C2C 100%)'
                    : 'linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)',
                  borderRadius: '6px',
                  width: i === 1 ? '85%' : i === 2 ? '70%' : '100%',
                  backgroundSize: '200% 100%',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
              >
                <motion.div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: currentTheme === "dark"
                      ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                      : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                    backgroundSize: '200% 100%'
                  }}
                  variants={shimmerVariants}
                  initial="initial"
                  animate="animate"
                />
              </motion.div>
            ))}
            <motion.div
              style={{
                ...loadingIndicatorContainerStyle,
                color: currentTheme === "dark" ? '#666' : '#999'
              }}
              variants={loadingVariants}
              animate="animate"
            >
              <motion.div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'currentColor'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0
                }}
              />
              <motion.div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'currentColor'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.2
                }}
              />
              <motion.div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'currentColor'
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: 0.4
                }}
              />
            </motion.div>
          </motion.div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : (
          <motion.div
            variants={textVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            {/* Explanation */}
            {(streamingText || mode !== "free") && (
              <motion.div
                style={{
                  ...themedStyles.explanation,
                  textAlign: textDirection === "rtl" ? "right" : "left"
                }}
                initial={{ y: 50 }}
                animate={{ y: 0 }}
              >
                <div style={{ marginBottom: '8px' }}>
                  {streamingText && (
                    <div style={{
                      ...themedStyles.explanation,
                      textAlign: themedStyles.explanation.textAlign as "left" | "right"
                    }} className="streaming-text">
                      <MarkdownText text={streamingText} />
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {!isLoading && streamingText && (
                  <motion.div style={{ display: 'flex', gap: '8px', alignItems: 'center' } as const}>
                    {/* Copy button */}
                    <motion.button
                      onClick={() => handleCopy(streamingText, 'initial')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: '#666'
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {copiedId === 'initial' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 62 61" fill="none">
                          <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                        </svg>
                      )}
                    </motion.button>

                    {/* Speak button */}
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
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                          <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                        </svg>
                      ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                        </svg>
                      )}
                    </motion.button>

                    {/* Regenerate button */}
                    <motion.button
                      onClick={handleRegenerate}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        color: isLoading ? '#14742F' : '#666'
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Regenerate response"
                      disabled={isLoading}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                      </svg>
                    </motion.button>

                    {/* Model display */}
                    <motion.div
                      style={{
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '-3px',
                        minWidth: '80px',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ 
                        textTransform: 'capitalize',
                        fontWeight: 500,
                        color: currentTheme === 'dark' ? 'rgb(132, 132, 132)' : 'rgb(102, 102, 102)',
                        userSelect: 'none',
                        backgroundColor: currentTheme === 'dark' ? '#494949' : '#f0f0f0',
                        padding: '2px 10px',
                        borderRadius: '11px',
                      }}>
                        {currentModel || 'Loading...'}
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Follow-up QAs */}
            {followUpQAs.map(({ question, answer, id, isComplete }) => (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 100,
                    damping: 15
                  }
                }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                style={themedStyles.followUpQA}
              >
                {/* Question bubble */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                      delay: 0.1
                    }
                  }}
                  style={questionBubbleStyle}
                >
                  <div style={{
                    ...themedStyles.followUpQuestion,
                    textAlign: textDirection === "rtl" ? "right" : "left"
                  }}>
                    {question}
                  </div>
                </motion.div>

                {/* Answer bubble */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: 1,
                    transition: {
                      type: "spring",
                      stiffness: 120,
                      damping: 20,
                      delay: 0.2
                    }
                  }}
                  style={answerBubbleStyle}
                >
                  <div style={{
                    ...themedStyles.followUpAnswer,
                    textAlign: textDirection === "rtl" ? "right" : "left"
                  }}>
                    <MarkdownText
                      text={answer}
                      isStreaming={activeAnswerId === id && !isComplete}
                      language={targetLanguage}
                    />
                    
                    {isComplete && (
                      <motion.div 
                        style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ 
                          opacity: 1, 
                          y: 0,
                          transition: {
                            delay: 0.3,
                            duration: 0.2
                          }
                        }}
                      >
                        <motion.button
                          onClick={() => handleCopy(answer, `followup-${id}`)}
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
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          {copiedId === `followup-${id}` ? (
                            <motion.svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 24 24" 
                              fill="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                            </motion.svg>
                          ) : (
                            <motion.svg 
                              width="12" 
                              height="12" 
                              viewBox="0 0 62 61" 
                              fill="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                              <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                            </motion.svg>
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
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          title={speakingId === `followup-${id}` ? "Stop speaking" : "Read text aloud"}
                        >
                          {speakingId === `followup-${id}` ? (
                            <motion.svg 
                              width="17" 
                              height="17" 
                              viewBox="0 0 24 24" 
                              fill="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                              <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                            </motion.svg>
                          ) : (
                            <motion.svg 
                              width="17" 
                              height="17" 
                              viewBox="0 0 24 24" 
                              fill="currentColor"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                            </motion.svg>
                          )}
                        </motion.button>

                        {/* Add regenerate button for follow-up */}
                        <motion.button
                          onClick={() => handleRegenerateFollowUp(question, id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            color: (activeAnswerId === id && !isComplete) ? '#14742F' : '#666'
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          title="Regenerate response"
                          disabled={activeAnswerId === id && !isComplete}
                        >
                          <motion.svg 
                            width="13" 
                            height="13" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 10 }}
                          >
                            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                          </motion.svg>
                        </motion.button>

                        {/* Add model display */}
                        <motion.div
                          style={{
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginLeft: '4px',
                            minWidth: '80px',
                            justifyContent: 'center'
                          }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <span style={{ 
                            textTransform: 'capitalize',
                            fontWeight: 500,
                            color: currentTheme === 'dark' ? 'rgb(132, 132, 132)' : 'rgb(102, 102, 102)',
                            userSelect: 'none',
                            backgroundColor: currentTheme === 'dark' ? '#494949' : '#f0f0f0',
                            padding: '2px 10px',
                            borderRadius: '11px',
                          }}>
                            {currentModel || 'Loading...'}
                          </span>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}

            {/* Spacer to push the search input to the bottom */}
            <div style={{ flexGrow: 1 }}></div>

            {/* Input section - now at the bottom */}
            <div style={{
              ...themedStyles.followUpInputContainer,
              marginTop: '8px',
              paddingTop: '8px',
              // background: `linear-gradient(180deg, transparent 0%, ${THEME_COLORS[currentTheme].background}80 30%, ${THEME_COLORS[currentTheme].background} 100%)`,
            }}>
              <div style={themedStyles.searchContainer}>
                <input
                  ref={inputRef}
                  type="text"
                  value={followUpQuestion}
                  onChange={handleFollowUpQuestion}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      handleAskFollowUpWrapper();
                    }
                  }}
                  placeholder="Ask anything..."
                  style={{
                    ...themedStyles.input,
                    opacity: isAskingFollowUp ? 0.7 : 1,
                  }}
                  disabled={isAskingFollowUp}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                />
                <motion.button
                  onClick={handleAskFollowUpWrapper}
                  disabled={!followUpQuestion.trim() || isAskingFollowUp}
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  whileTap={{ scale: 0.95 }}
                  animate={isAskingFollowUp ? { scale: 0.9, opacity: 0.7 } : { scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  style={themedStyles.searchSendButton}
                >
                  {isAskingFollowUp ? (
                    <motion.svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </motion.svg>
                  ) : (
                    <motion.svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none"
                      initial={{ scale: 1 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </motion.svg>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            variants={toastMotionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              backgroundColor: currentTheme === "dark" ? '#2C2C2C' : 'white',
              color: currentTheme === "dark" ? 'white' : 'black',
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: Z_INDEX.TOAST,
              fontSize: '14px',
              fontFamily: "'K2D', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isEnabled ? '#10B981' : '#EF4444',
                marginRight: '4px'
              }}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main popup */}
      <AnimatePresence mode="sync">
        {isVisible && isEnabled && isConfigured && (
          settings?.customization?.layoutMode === "floating" ? (
            <motion.div
              style={{
                position: 'fixed',
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: Z_INDEX.POPUP,
                pointerEvents: 'none'
              }}
              initial={settings?.customization?.popupAnimation === "none" ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: settings?.customization?.popupAnimation === "none" ? 0 : 0.2 }}
            >
              <div style={{
                ...themedStyles.popupPositioner,
                pointerEvents: 'auto'
              }}>
                <motion.div 
                  ref={popupRef}
                  style={{
                    ...themedStyles.popup,
                    width: `${width}px`,
                    height: `${height}px`,
                    overflow: 'auto',
                    position: 'relative',
                    scrollBehavior: 'smooth'
                  }}
                  data-plasmo-popup
                  className="no-select"
                  onClick={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setIsInteractingWithPopup(true)}
                  onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
                  initial={settings?.customization?.popupAnimation === "none" ? { scale: 1, opacity: 1 } : "initial"}
                  animate={settings?.customization?.popupAnimation === "none" ? { scale: 1, opacity: 1 } : "animate"}
                  exit={settings?.customization?.popupAnimation === "none" ? { scale: 1, opacity: 0 } : "exit"}
                  layout
                  variants={
                    settings?.customization?.popupAnimation === "scale" 
                      ? scaleMotionVariants 
                      : settings?.customization?.popupAnimation === "fade"
                        ? fadeMotionVariants
                        : noMotionVariants
                  }
                >
                  {/* Popup Content */}
                  {renderPopupContent()}
                  
                  {/* Resize handle */}
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
          ) : settings?.customization?.layoutMode === "sidebar" ? (
            // Sidebar Mode
            <motion.div
              ref={popupRef}
              style={{
                ...themedStyles.sidebarPopup,
                width: `${width}px`,
                minWidth: "350px",
                maxWidth: "800px",
                resize: "horizontal",
                overflow: "auto",
                scrollBehavior: 'smooth'
              }}
              data-plasmo-popup
              className="no-select"
              onClick={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onMouseEnter={() => setIsInteractingWithPopup(true)}
              onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
              initial={{ x: 150, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 150, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Sidebar Popup Content */}
              {renderPopupContent()}
            </motion.div>
          ) : (
            // Centered Mode
            <>
              {/* Background overlay with blur */}
              <motion.div
                style={themedStyles.centeredPopupOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsVisible(false)}
              />
              
              {/* Centered popup */}
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: Z_INDEX.CENTERED_POPUP,
                pointerEvents: 'none'
              }}>
                <motion.div
                  ref={popupRef}
                  style={{
                    ...themedStyles.centeredPopup,
                    width: `${Math.max(width, 650)}px`,
                    height: `${Math.max(height, 450)}px`,
                    overflow: "auto",
                    scrollBehavior: 'smooth',
                    pointerEvents: 'auto'
                  }}
                  data-plasmo-popup
                  className="no-select"
                  onClick={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setIsInteractingWithPopup(true)}
                  onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
                  initial={{ scale: 0.95, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 10 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {/* Centered Popup Content */}
                  {renderPopupContent()}
                  
                  {/* Resize handle - smaller and less visible */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: '12px',
                      height: '12px',
                      cursor: 'se-resize',
                      background: 'transparent'
                    }}
                    onMouseDown={handleResizeStart}
                    className="resize-handle"
                  />
                </motion.div>
              </div>
            </>
          )
        )}
      </AnimatePresence>

      {/* Blur overlay */}
      {isBlurActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: currentTheme === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: Z_INDEX.BLUR_OVERLAY,
            transition: 'all 0.3s ease'
          }}
        />
      )}
    </>
  );
}

export default Content;
