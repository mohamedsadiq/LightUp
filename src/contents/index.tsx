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

// Add this style block right after your imports
const fontImportStyle = document.createElement('style');
fontImportStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=K2D:wght@400;500;600;700&display=swap');
  
  ::selection {
    background-color: #ff0 !important;
    color: #000000 !important;
  }
  
  ::-moz-selection {
    background-color: #ff0 !important;
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
  modelType: "local" | "openai";
  serverUrl?: string;
  apiKey?: string;
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
  const [feedbacks, setFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({});
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
        if (newMode === "explain" || newMode === "summarize" || 
            newMode === "analyze" || newMode === "translate") {
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
      
      // Check if settings are properly configured
      if (savedSettings) {
        if (savedSettings.modelType === "local" && savedSettings.serverUrl) {
          console.log('✅ Local model configured');
          setIsConfigured(true);
        } else if (savedSettings.modelType === "openai" && savedSettings.apiKey) {
          console.log('✅ OpenAI configured');
          setIsConfigured(true);
        } else {
          console.log('⚠️ Settings not properly configured');
          setIsConfigured(false);
        }
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
      console.log('✨ Processed text:', text);

      if (text && text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
        console.log('🎯 Valid text selected:', {
          text,
          mode,
          settings
        });

        setSelectedText(text);
        const { top, left } = calculatePosition(event.clientX, event.clientY);
        setPosition({
          x: left,
          y: top
        });
        setIsVisible(true);
        setError(null);
        setIsLoading(true);
        setFollowUpQAs([]);
        setIsExplanationComplete(false);
        setStreamingText('');

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
            connectionId
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
              connectionId
            }
          });

        } catch (err) {
          console.error('❌ Error processing text:', err);
          setError('Failed to process text');
          setIsLoading(false);
        }
      } else {
        console.log('⚠️ Invalid text selection:', text);
      }
    }

    // Add the event listeners
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [mode, isConfigured, isInteractingWithPopup])

 

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim() || isAskingFollowUp) return;

    console.log('Starting follow-up question:', followUpQuestion);
    setIsAskingFollowUp(false);
    const newId = Date.now();
    
    // Set the active answer ID first
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
        throw new Error('Connection not established');
      }

      console.log('Sending follow-up request with ID:', newId);
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: followUpQuestion,
          context: selectedText,
          mode: mode,
          settings,
          isFollowUp: true,
          id: newId // Add the ID to the payload
        }
      });
    } catch (error) {
      console.error('Follow-up error:', error);
      setError('Failed to process follow-up question');
      setFollowUpQAs(prev => prev.filter(qa => qa.id !== newId));
      setActiveAnswerId(null);
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
      return (
        <div style={styles.configurationWarning}>
          ⚠️ Extension not configured. Please visit the options page to set it up.
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

  const handleFeedback = async (id: string, text: string, type: 'like' | 'dislike') => {
    setFeedbacks(prev => {
      // If clicking the same button, remove the feedback
      if (prev[id] === type) {
        const newFeedbacks = { ...prev };
        delete newFeedbacks[id];
        return newFeedbacks;
      }
      
      // Otherwise, set the new feedback
      return {
        ...prev,
        [id]: type
      };
    });

    // Store in storage after state update
    const feedback = {
      id,
      text,
      feedback: type,
      context: selectedText,
      timestamp: Date.now()
    };
    
    const existingFeedbacks = await storage.get('feedbacks') || [];
    await storage.set('feedbacks', [...existingFeedbacks, feedback]);
  };

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

    // Add validation for translation mode
    if (newMode === 'translate' && (!translationSettings?.targetLanguage)) {
      console.error('❌ Translation settings missing target language');
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
      console.log('⚠️ No text selected for processing');
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
    }) => {
      console.log('📨 Port message received:', message);
      
      switch (message.type) {
        case 'chunk':
          if (message.content) {
            console.log('📝 Received chunk:', message.content);
            if (message.isFollowUp) {
              setFollowUpQAs(prev => {
                const lastQA = prev[prev.length - 1];
                if (!lastQA) return prev;
                
                return prev.map(qa => 
                  qa.id === lastQA.id
                    ? { ...qa, answer: qa.answer + message.content }
                    : qa
                );
              });
            } else {
              setStreamingText(prev => prev + message.content);
            }
          }
          break;
        case 'done':
          console.log('✅ Processing completed');
          if (message.isFollowUp) {
            setFollowUpQAs(prev => {
              return prev.map(qa => {
                if (qa.id === activeAnswerId) {
                  return { ...qa, isComplete: true };
                }
                return qa;
              });
            });
            setActiveAnswerId(null);
            setIsAskingFollowUp(false);
          } else {
            setIsExplanationComplete(true);
          }
          setIsLoading(false);
          break;
        case 'error':
          console.error('❌ Stream error:', message.error);
          setError(message.error || 'An unknown error occurred');
          setIsLoading(false);
          setActiveAnswerId(null);
          setIsAskingFollowUp(false);
          break;
      }
    });

    console.log('🔌 Port connected:', connectionId);
    setPort(newPort);

    return () => {
      console.log('🔌 Disconnecting port:', connectionId);
      newPort.postMessage({
        type: "STOP_GENERATION"
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

  return (
    <AnimatePresence mode="sync" >
      
      {isVisible && (
        <motion.div 
          style={styles.popupContainer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
       
        >
          <div style={{
            ...styles.popupPositioner,
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}>
            <motion.div 
              style={{
                ...styles.popup,
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
              <div style={styles.buttonContainerParent}>
                <motion.div style={{ marginLeft: '-6px' }} layout>
                  {Logo()}
                </motion.div>
                <PopupModeSelector 
                  activeMode={mode}
                  onModeChange={handleModeChange}
                  isLoading={isLoading}
                />
                <div style={styles.buttonContainer}>
                  <div style={{ position: 'relative' }}>
                    <motion.button 
                      onClick={handleClose}
                      style={{...styles.button, color: 'black', marginTop: '2px'}}
                      variants={iconButtonVariants}
                       whileHover="hover"
                       
                    >
                      {CloseIcon()}
                    </motion.button>
                  </div>
                </div>
              </div>

             

              <p style={{...styles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline'}}>
                {truncateText(selectedText)}
              </p>

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
                          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
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
                    style={styles.error}
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
                      style={styles.explanation}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1,  y: 0 }}
                      transition={{ type: 'spring', stiffness: 100, damping: 10, duration: 0.5 }}
                      exit={{ opacity: 0, y: 50 }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <MarkdownText 
                          text={streamingText} 
                          isStreaming={isLoading}
                          style={{
                            opacity: isLoading ? 0.7 : 1,
                            transition: 'opacity 0.2s'
                          }}
                        />
                      </div>

                      {isExplanationComplete && (
                        <motion.div
                          style={styles.feedbackContainer}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                        >
                          <motion.button
                            onClick={() => handleCopy(stripHtml(streamingText), 'initial')}
                            style={{
                              ...styles.feedbackButton,
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
                            onClick={() => handleFeedback('initial', streamingText, 'like')}
                            style={{
                              ...styles.feedbackButton,
                              color: feedbacks['initial'] === 'like' ? '#0F8A5F' : '#666'
                            }}
                            variants={feedbackButtonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            animate={feedbacks['initial'] === 'like' ? 'bounce' : 'initial'}
                          >
                           <svg width="12" height="12" viewBox="0 0 60 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6108 5.3736C25.764 7.54084 25.3317 10.0211 24.6313 12.611C23.4279 17.0604 21.7389 21.5198 17.1143 24.4812C16.6115 23.4546 15.9293 22.5592 15.1098 21.8767C13.4022 20.4546 11.2762 19.8232 9.17144 19.8232C7.0667 19.8232 4.91561 20.4546 3.208 21.8767C1.5004 23.299 0.351562 25.5931 0.351562 28.2376V53.08C0.351562 55.7245 1.5004 57.9937 3.208 59.4158C4.91561 60.8381 7.0667 61.4944 9.17144 61.4944C11.2762 61.4944 13.4022 60.8381 15.1098 59.4158C15.5279 59.0677 15.9177 58.6566 16.2624 58.2137C17.4974 59.1358 18.7774 59.8227 19.9958 60.1667C26.3043 62.0641 30.1481 64.2363 42.672 65.05C45.6787 65.0908 48.8912 64.4278 51.2412 63.3468C53.8736 62.1009 56.277 59.8363 56.7536 56.5853C57.5593 51.0892 59.2318 42.9913 59.6101 36.2506C59.7649 33.4891 59.4837 30.721 57.8812 28.3871C56.2941 26.0758 53.4946 24.5999 49.813 24.1298C46.2134 23.6486 42.2725 23.6761 39.0888 23.8794C41.1656 19.0706 42.7735 14.4192 42.6969 10.3563C42.6489 7.80672 41.9122 5.31376 40.0409 3.54473C38.1852 1.79028 35.4935 0.97847 32.2484 0.965332C28.8408 0.981354 27.4411 3.36224 26.6108 5.3736ZM32.1733 5.77446C34.6886 5.77446 36.0097 6.34218 36.7336 7.02654C37.4574 7.71099 37.8536 8.73124 37.8862 10.4574C37.6607 13.8029 35.2552 21.8166 31.4717 29.1143C38.4625 29.0289 43.905 28.1964 49.1365 28.8889C52 29.2376 53.2121 30.0582 53.9223 31.0927C54.6326 32.127 54.924 33.7774 54.7993 36.0011C54.4543 42.1487 52.8368 50.1289 51.993 55.885C51.7966 57.2241 50.9224 58.1687 49.1866 58.9903C47.4703 59.8027 45.0549 60.2576 42.8975 60.2675C30.8373 59.4754 28.0705 57.5713 21.2487 55.5344C18.9022 54.7338 18.0362 53.0605 18.0164 51.4023C17.9897 44.0898 17.9914 36.7773 17.9914 29.4648C25.1227 25.7173 27.8483 19.1081 29.2668 13.8632C30.3578 10.3696 30.7803 5.78719 32.1733 5.77446Z" fill="currentColor"/>
</svg>

                          </motion.button>
                          <motion.button
                            onClick={() => handleFeedback('initial', streamingText, 'dislike')}
                            style={{
                              ...styles.feedbackButton,
                              color: feedbacks['initial'] === 'dislike' ? '#ff4444' : '#666'
                            }}
                            variants={feedbackButtonVariants}
                            initial="initial"
                            whileHover="hover"
                            whileTap="tap"
                            animate={feedbacks['initial'] === 'dislike' ? 'bounce' : 'initial'}
                          >
                            <svg width="12" height="12" viewBox="0 0 57 62" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.5335 57.716C32.3412 55.6216 32.7536 53.2247 33.4217 50.7219C34.5696 46.422 36.1808 42.1125 40.5921 39.2507C41.0718 40.2428 41.7225 41.108 42.5042 41.7676C44.1331 43.142 46.1611 43.7521 48.1688 43.7521C50.1765 43.7521 52.2284 43.142 53.8573 41.7676C55.4862 40.3932 56.582 38.1762 56.582 35.6205L56.582 11.6132C56.582 9.05756 55.4862 6.8647 53.8573 5.49035C52.2284 4.11592 50.1765 3.48165 48.1688 3.48165C46.1611 3.48165 44.1331 4.11584 42.5042 5.49035C42.1054 5.8268 41.7335 6.22409 41.4047 6.65204C40.2267 5.76099 39.0057 5.09715 37.8435 4.76473C31.8258 2.93107 28.1593 0.83196 16.2128 0.0455745C13.3447 0.00609211 10.2804 0.646858 8.03869 1.6915C5.52762 2.89554 3.23507 5.08399 2.78042 8.22573C2.01189 13.5371 0.416488 21.3628 0.0556785 27.8769C-0.0920192 30.5456 0.176238 33.2206 1.70486 35.4761C3.21879 37.7097 5.8892 39.1359 9.40106 39.5902C12.8347 40.0552 16.5938 40.0287 19.6308 39.8322C17.6497 44.4794 16.116 48.9744 16.189 52.9008C16.2348 55.3647 16.9376 57.7738 18.7225 59.4834C20.4928 61.1788 23.0604 61.9634 26.1558 61.9761C29.4063 61.9606 30.7414 59.6597 31.5335 57.716ZM26.2275 57.3286C23.8281 57.3286 22.5679 56.78 21.8774 56.1186C21.1869 55.4572 20.809 54.4712 20.778 52.8031C20.9931 49.57 23.2876 41.8257 26.8967 34.7733C20.2282 34.8559 15.0367 35.6604 10.0463 34.9911C7.31486 34.6541 6.15869 33.8611 5.48118 32.8614C4.80368 31.8619 4.5257 30.2669 4.64464 28.118C4.97371 22.177 6.51669 14.4651 7.32158 8.9025C7.50886 7.60842 8.3428 6.69554 9.99852 5.90157C11.6357 5.1165 13.9397 4.67686 15.9977 4.66727C27.5018 5.43275 30.1411 7.27283 36.6484 9.24135C38.8867 10.015 39.7127 11.632 39.7317 13.2345C39.7571 20.3012 39.7555 27.3679 39.7555 34.4346C32.953 38.0561 30.3531 44.4431 28.9999 49.5118C27.9592 52.8879 27.5563 57.3163 26.2275 57.3286Z" fill="currentColor"/>
</svg>

                           
                          </motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                    {followUpQAs.map(({ question, answer, id, isComplete }) => (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={styles.followUpQA}
                      >
                        
                        {/* Question bubble */}
                        <motion.div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            width: '100%'
                          }}
                        >
                          <div style={styles.followUpQuestion}>
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
                          <div style={styles.followUpAnswer}>
                            <MarkdownText
                              text={answer}
                              isStreaming={activeAnswerId === id && !isComplete}
                              style={{
                                margin: 10,
                                opacity: activeAnswerId === id && !isComplete ? 0.7 : 1
                              }}
                              onMount={() => console.log('Follow-up Answer:', answer)}
                            />
                            
                            {!isComplete && (
                              <motion.div
                                style={{
                                  ...styles.feedbackContainer,
                                  opacity: 0.8
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.8 }}
                                transition={{ delay: 0.2 }}
                              >
                                {/* Copy button */}
                                <motion.button
                                  onClick={() => handleCopy(stripHtml(answer), `followup-${id}`)}
                                  style={{
                                    ...styles.feedbackButton,
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
                                {/* Like button */}
                                <motion.button
                                  onClick={() => handleFeedback(`followup-${id}`, answer, 'like')}
                                  style={{
                                    ...styles.feedbackButton,
                                    color: feedbacks[`followup-${id}`] === 'like' ? '#0F8A5F' : '#666'
                                  }}
                                  variants={feedbackButtonVariants}
                                  initial="initial"
                                  whileHover="hover"
                                  whileTap="tap"
                                >
                                 <svg width="12" height="12" viewBox="0 0 60 66" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M26.6108 5.3736C25.764 7.54084 25.3317 10.0211 24.6313 12.611C23.4279 17.0604 21.7389 21.5198 17.1143 24.4812C16.6115 23.4546 15.9293 22.5592 15.1098 21.8767C13.4022 20.4546 11.2762 19.8232 9.17144 19.8232C7.0667 19.8232 4.91561 20.4546 3.208 21.8767C1.5004 23.299 0.351562 25.5931 0.351562 28.2376V53.08C0.351562 55.7245 1.5004 57.9937 3.208 59.4158C4.91561 60.8381 7.0667 61.4944 9.17144 61.4944C11.2762 61.4944 13.4022 60.8381 15.1098 59.4158C15.5279 59.0677 15.9177 58.6566 16.2624 58.2137C17.4974 59.1358 18.7774 59.8227 19.9958 60.1667C26.3043 62.0641 30.1481 64.2363 42.672 65.05C45.6787 65.0908 48.8912 64.4278 51.2412 63.3468C53.8736 62.1009 56.277 59.8363 56.7536 56.5853C57.5593 51.0892 59.2318 42.9913 59.6101 36.2506C59.7649 33.4891 59.4837 30.721 57.8812 28.3871C56.2941 26.0758 53.4946 24.5999 49.813 24.1298C46.2134 23.6486 42.2725 23.6761 39.0888 23.8794C41.1656 19.0706 42.7735 14.4192 42.6969 10.3563C42.6489 7.80672 41.9122 5.31376 40.0409 3.54473C38.1852 1.79028 35.4935 0.97847 32.2484 0.965332C28.8408 0.981354 27.4411 3.36224 26.6108 5.3736ZM32.1733 5.77446C34.6886 5.77446 36.0097 6.34218 36.7336 7.02654C37.4574 7.71099 37.8536 8.73124 37.8862 10.4574C37.6607 13.8029 35.2552 21.8166 31.4717 29.1143C38.4625 29.0289 43.905 28.1964 49.1365 28.8889C52 29.2376 53.2121 30.0582 53.9223 31.0927C54.6326 32.127 54.924 33.7774 54.7993 36.0011C54.4543 42.1487 52.8368 50.1289 51.993 55.885C51.7966 57.2241 50.9224 58.1687 49.1866 58.9903C47.4703 59.8027 45.0549 60.2576 42.8975 60.2675C30.8373 59.4754 28.0705 57.5713 21.2487 55.5344C18.9022 54.7338 18.0362 53.0605 18.0164 51.4023C17.9897 44.0898 17.9914 36.7773 17.9914 29.4648C25.1227 25.7173 27.8483 19.1081 29.2668 13.8632C30.3578 10.3696 30.7803 5.78719 32.1733 5.77446Z" fill="currentColor"/>
</svg>

                                </motion.button>
                                {/* Dislike button */}
                                <motion.button
                                  onClick={() => handleFeedback(`followup-${id}`, answer, 'dislike')}
                                  style={{
                                    ...styles.feedbackButton,
                                    color: feedbacks[`followup-${id}`] === 'dislike' ? '#ff4444' : '#666'
                                  }}
                                  variants={feedbackButtonVariants}
                                  initial="initial"
                                  whileHover="hover"
                                  whileTap="tap"
                                >
                                  <svg width="12" height="12" viewBox="0 0 57 62" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M31.5335 57.716C32.3412 55.6216 32.7536 53.2247 33.4217 50.7219C34.5696 46.422 36.1808 42.1125 40.5921 39.2507C41.0718 40.2428 41.7225 41.108 42.5042 41.7676C44.1331 43.142 46.1611 43.7521 48.1688 43.7521C50.1765 43.7521 52.2284 43.142 53.8573 41.7676C55.4862 40.3932 56.582 38.1762 56.582 35.6205L56.582 11.6132C56.582 9.05756 55.4862 6.8647 53.8573 5.49035C52.2284 4.11592 50.1765 3.48165 48.1688 3.48165C46.1611 3.48165 44.1331 4.11584 42.5042 5.49035C42.1054 5.8268 41.7335 6.22409 41.4047 6.65204C40.2267 5.76099 39.0057 5.09715 37.8435 4.76473C31.8258 2.93107 28.1593 0.83196 16.2128 0.0455745C13.3447 0.00609211 10.2804 0.646858 8.03869 1.6915C5.52762 2.89554 3.23507 5.08399 2.78042 8.22573C2.01189 13.5371 0.416488 21.3628 0.0556785 27.8769C-0.0920192 30.5456 0.176238 33.2206 1.70486 35.4761C3.21879 37.7097 5.8892 39.1359 9.40106 39.5902C12.8347 40.0552 16.5938 40.0287 19.6308 39.8322C17.6497 44.4794 16.116 48.9744 16.189 52.9008C16.2348 55.3647 16.9376 57.7738 18.7225 59.4834C20.4928 61.1788 23.0604 61.9634 26.1558 61.9761C29.4063 61.9606 30.7414 59.6597 31.5335 57.716ZM26.2275 57.3286C23.8281 57.3286 22.5679 56.78 21.8774 56.1186C21.1869 55.4572 20.809 54.4712 20.778 52.8031C20.9931 49.57 23.2876 41.8257 26.8967 34.7733C20.2282 34.8559 15.0367 35.6604 10.0463 34.9911C7.31486 34.6541 6.15869 33.8611 5.48118 32.8614C4.80368 31.8619 4.5257 30.2669 4.64464 28.118C4.97371 22.177 6.51669 14.4651 7.32158 8.9025C7.50886 7.60842 8.3428 6.69554 9.99852 5.90157C11.6357 5.1165 13.9397 4.67686 15.9977 4.66727C27.5018 5.43275 30.1411 7.27283 36.6484 9.24135C38.8867 10.015 39.7127 11.632 39.7317 13.2345C39.7571 20.3012 39.7555 27.3679 39.7555 34.4346C32.953 38.0561 30.3531 44.4431 28.9999 49.5118C27.9592 52.8879 27.5563 57.3163 26.2275 57.3286Z" fill="currentColor"/>
</svg>

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
                      style={styles.followUpInputContainer}
                    >
                      <div style={styles.searchContainer}>
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
                          style={styles.input}
                          disabled={isAskingFollowUp}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setIsInputFocused(false)}
                        />
                        <motion.button
                          onClick={handleAskFollowUp}
                          disabled={!followUpQuestion.trim() || isAskingFollowUp}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={styles.searchSendButton}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  )
}

export default Content
