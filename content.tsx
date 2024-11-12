import { useState, useEffect } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"
import { motion, AnimatePresence, usePresence } from "framer-motion"

// Add this style block right after your imports
const fontImportStyle = document.createElement('style');
fontImportStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=K2D:wght@400;500;600;700&display=swap');
`;
document.head.appendChild(fontImportStyle);

// This tells Plasmo to inject this component into the webpage
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

// Add this new component
const TypewriterText = ({ text, speed = 100, stopAnimation = false }) => {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPresent, safeToRemove] = usePresence()
  const [currentText, setCurrentText] = useState(text)

  useEffect(() => {
    if (!isPresent || stopAnimation) {
      safeToRemove?.()
      return
    }

    if (currentIndex < currentText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + currentText[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, currentText, speed, isPresent, stopAnimation])

  // Only reset when text is completely different
  useEffect(() => {
    if (text !== currentText && displayedText.length === 0) {
      setCurrentText(text)
      setDisplayedText("")
      setCurrentIndex(0)
    }
  }, [text, currentText, displayedText.length])

  // Format the text with proper line breaks and code blocks
  const formattedText = displayedText
    .split('\n')
    .map((line, i) => {
      // Check if line is a code block
      if (line.startsWith('```')) {
        return (
          <pre key={i} style={{
            backgroundColor: '#1e1e1e',
            padding: '12px',
            borderRadius: '4px',
            color: '#d4d4d4',
            fontFamily: 'monospace',
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {line.replace(/```/g, '')}
          </pre>
        )
      }
      // Check if line is bold (between ** **)
      const boldPattern = /\*\*(.*?)\*\*/g
      const lineWithBold = line.split(boldPattern).map((part, index) => {
        return index % 2 === 0 ? (
          part
        ) : (
          <strong key={index}>{part}</strong>
        )
      })

      return <p key={i} style={{ margin: '8px 0' }}>{lineWithBold}</p>
    })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      style={{
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#333'
      }}
    >
      {formattedText}
      {currentIndex < currentText.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ display: 'inline-block', marginLeft: '2px' }}
        >
          |
        </motion.span>
      )}
    </motion.div>
  )
}

function Content() {
  const [selectedText, setSelectedText] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [explanation, setExplanation] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"explain" | "summarize">("explain")
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false)
  const storage = new Storage()
  const [followUpQAs, setFollowUpQAs] = useState<Array<{
    question: string;
    answer: string;
    id: number;
  }>>([])
  const [activeAnswerId, setActiveAnswerId] = useState<number | null>(null)
  const [settings, setSettings] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({});

  // Load the mode when component mounts
  useEffect(() => {
    const loadMode = async () => {
      const savedMode = await storage.get("mode")
      if (savedMode) {
        setMode(savedMode)
      }
    }
    loadMode()

    // Add storage listener to update mode when changed from options
    const handleStorageChange = async (changes) => {
      const newMode = await storage.get("mode")
      if (newMode) {
        setMode(newMode)
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
      const savedSettings = await storage.get("settings");
      setSettings(savedSettings);
      
      // Check if settings are properly configured
      if (savedSettings) {
        if (savedSettings.modelType === "local" && savedSettings.serverUrl) {
          setIsConfigured(true);
        } else if (savedSettings.modelType === "openai" && savedSettings.apiKey) {
          setIsConfigured(true);
        } else {
          setIsConfigured(false);
        }
      } else {
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
      const popup = document.querySelector('[data-plasmo-popup]')
      const selection = window.getSelection()
      
      // Check if selection contains any elements with the no-select class
      const checkSelectionForClass = () => {
        if (!selection || selection.rangeCount === 0) return false
        
        const range = selection.getRangeAt(0)
        const container = document.createElement('div')
        container.appendChild(range.cloneContents())
        
        // Check if the selection or any of its parents has the no-select class
        const hasNoSelectClass = (element: Element | null): boolean => {
          while (element) {
            if (element.classList?.contains('no-select')) return true
            if (element === popup) return true
            element = element.parentElement
          }
          return false
        }

        // Check the actual selected elements
        if (selection.anchorNode && hasNoSelectClass(selection.anchorNode.parentElement)) return true
        if (selection.focusNode && hasNoSelectClass(selection.focusNode.parentElement)) return true
        
        return false
      }

      if (popup?.contains(event.target as Node) || checkSelectionForClass()) {
        return // Exit early if interaction is within popup
      }

      if (!isConfigured) {
        setError("Please configure the extension in the options page first.");
        return;
      }

      const text = selection?.toString().trim()

      if (text && text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
        const { top, left } = calculatePosition(event.clientX, event.clientY);
        setSelectedText(text)
        setPosition({
          x: left,
          y: top
        })
        setIsVisible(true)
        setError(null)
        setIsLoading(true)
        setFollowUpQAs([])
        
        try {
          const response = await sendToBackground({
            name: "processText",
            body: {
              text,
              mode,
              maxTokens: 2048,
              settings
            }
          })

          if (response.result) {
            setExplanation(response.result)
          } else if (response.error) {
            setError(response.error)
          }
        } catch (err) {
          console.error('Error:', err)
          setError('Failed to process text')
        } finally {
          setIsLoading(false)
        }
      }
    }

    // Add the event listeners
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("click", handleClickOutside)

    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("click", handleClickOutside)
    }
  }, [mode, isConfigured])

  const formatFollowUpQA = (question: string, answer: string) => {
    return {
      question,
      answer,
      id: Date.now() // Add unique ID for animation keys
    }
  }

  const handleAskFollowUp = async () => {
    if (!followUpQuestion.trim()) return

    setActiveAnswerId(null)
    setIsAskingFollowUp(true)
    setError(null)

    try {
      const response = await sendToBackground({
        name: "processText",
        body: {
          text: `Based on this context: "${selectedText}", ${followUpQuestion}`,
          mode: "explain",
          maxTokens: 2048
        }
      })
      if (response.result) {
        const newQA = formatFollowUpQA(followUpQuestion, response.result)
        setFollowUpQAs(prev => [...prev, newQA])
        setActiveAnswerId(newQA.id)
        setFollowUpQuestion("")
      } else if (response.error) {
        setError(response.error)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to get answer')
    } finally {
      setIsAskingFollowUp(false)
    }
  }

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

  const Logo = () => (
    <svg width="30" height="30" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d_171_147)">
        <circle cx="101.067" cy="101.227" r="32.1546" fill="black"/>
        <circle cx="101.067" cy="101.227" r="31.5012" stroke="#A72D20" stroke-width="1.30683"/>
        </g>
        <g filter="url(#filter1_d_171_147)">
        <ellipse cx="101.782" cy="101.42" rx="29.7391" ry="30.2609" fill="black"/>
        </g>
        <defs>
        <filter id="filter0_d_171_147" x="0.772979" y="0.061912" width="200.587" height="200.588" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feMorphology radius="11.4783" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_171_147"/>
        <feOffset dy="-0.871223"/>
        <feGaussianBlur stdDeviation="28.3304"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
        </filter>
        <filter id="filter1_d_171_147" x="52.8761" y="51.9923" width="97.8123" height="98.8553" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="9.58345"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
        </filter>
        </defs>
        </svg>
  )
  const CloseIcon = () => (
    <svg width="13" height="13" viewBox="0 0 87 86" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M43.17 0C14.389 0 0 14.251 0 42.752C0 71.253 14.389 85.503 43.17 85.503C71.995 85.503 86.408 71.253 86.408 42.752C86.408 14.251 71.995 0 43.17 0ZM68.391 68.769C63.103 74.266 54.697 77.015 43.17 77.015C31.734 77.015 23.36 74.267 18.05 68.769C12.74 63.273 10.085 54.6 10.085 42.752C10.085 30.903 12.74 22.23 18.05 16.734C23.36 11.237 31.734 8.488 43.17 8.488C54.697 8.488 63.103 11.237 68.391 16.734C73.678 22.23 76.322 30.903 76.322 42.752C76.322 54.6 73.678 63.273 68.391 68.769Z" fill="currentColor"/>
      <path d="M60.8462 25.131C58.8102 23.095 55.5102 23.095 53.4742 25.131L43.2042 35.401L32.9342 25.131C30.8982 23.095 27.5982 23.095 25.5622 25.131C23.5262 27.167 23.5262 30.467 25.5622 32.503L35.8322 42.773L25.5622 53.043C23.5262 55.079 23.5262 58.379 25.5622 60.415C27.5982 62.451 30.8982 62.451 32.9342 60.415L43.2042 50.145L53.4742 60.415C55.5102 62.451 58.8102 62.451 60.8462 60.415C62.8822 58.379 62.8822 55.079 60.8462 53.043L50.5762 42.773L60.8462 32.503C62.8822 30.467 62.8822 27.166 60.8462 25.131Z" fill="currentColor"/>
    </svg>
  );

  const PinIcon = () => (
    <svg width="13" height="13" viewBox="0 0 80 81" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M44.9453 0.031461C51.3157 1.40143 55.863 4.04868 61 8.00021C61.669 8.49263 62.338 8.98505 63.0273 9.4924C70.0576 15.0888 77.8855 23.9484 79.25 33.1252C79 37.0002 79 37.0002 77.7031 38.758C76 40.0002 76 40.0002 72.5 39.7502C69 39.0002 69 39.0002 66 38.0002C65.5968 38.8607 65.5968 38.8607 65.1855 39.7385C63.9665 42.0641 62.588 44.0748 61.0312 46.1877C60.4602 46.9689 59.8891 47.7501 59.3008 48.5549C57.5 51.0002 57.5 51.0002 55.6992 53.4455C55.1282 54.2267 54.5571 55.0079 53.9688 55.8127C53.4473 56.5204 52.9259 57.2281 52.3887 57.9572C51.0356 59.9479 49.8587 61.7487 49 64.0002C49.4538 64.9077 49.9075 65.8152 50.375 66.7502C52.4418 70.8838 52.2361 73.4347 52 78.0002C48.4929 79.3578 46.2323 78.943 42.875 77.5627C24.8706 68.8441 9.87213 52.7445 1 35.0002C0.875 31.4377 0.875 31.4377 1 28.0002C2 27.0002 2 27.0002 4.6875 26.7502C8 27.0002 8 27.0002 11.0625 28.5627C14.5571 30.2728 15.368 30.1794 19 29.0002C21.1931 27.5173 23.2048 26.0372 25.25 24.3752C25.8149 23.9281 26.3797 23.4809 26.9617 23.0202C28.1034 22.116 29.2423 21.2083 30.3784 20.2971C32.6701 18.4643 34.9913 16.6704 37.3125 14.8752C38.542 13.9172 39.7713 12.9591 41 12.0002C40.505 11.0102 40.505 11.0102 40 10.0002C39.7969 8.12521 39.7969 8.12521 39.75 6.00021C39.7242 5.29896 39.6984 4.59771 39.6719 3.87521C39.7802 3.25646 39.8884 2.63771 40 2.00021C43 0.000211 43 0.000210986 44.9453 0.031461ZM50.5625 18.3869C49.8398 18.9075 49.1171 19.428 48.3726 19.9643C47.5896 20.533 46.8067 21.1018 46 21.6877C45.2029 22.2648 44.4058 22.8419 43.5845 23.4365C35.2776 29.4784 27.1247 35.7165 19 42.0002C20.4158 46.554 22.9551 49.3793 26.3125 52.6252C27.0231 53.3406 27.0231 53.3406 27.748 54.0705C30.6116 56.8909 33.4696 59.0839 37 61.0002C47.0573 48.2325 47.0573 48.2325 56.75 35.1877C57.1552 34.6326 57.5605 34.0775 57.978 33.5056C60.1503 30.4576 61.7708 27.5376 63 24.0002C61.6905 22.6639 60.3773 21.3312 59.0625 20.0002C58.3316 19.2577 57.6007 18.5152 56.8477 17.7502C53.9847 15.0386 53.5406 16.2398 50.5625 18.3869Z" fill="black"/>
    <path d="M17 58C19.6219 59.0487 20.7937 59.6493 22.25 62.125C22.4975 62.7437 22.745 63.3625 23 64C20.5044 66.6706 17.9747 69.3064 15.4375 71.9375C14.7331 72.6922 14.0286 73.447 13.3028 74.2246C7.30863 80.3845 7.30863 80.3845 2.97269 81.0039C1.99171 81.0026 1.01074 81.0013 3.19777e-05 81C-0.00668808 75.886 1.04422 73.53 4.59769 69.8164C6.07092 68.3828 7.5598 66.9651 9.06253 65.5625C9.82115 64.831 10.5798 64.0994 11.3614 63.3457C13.2281 61.5494 15.1073 59.7687 17 58Z" fill="black"/>
    </svg>
  );

  // Add this helper function inside the Content component
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    
    const halfLength = Math.floor(maxLength / 2);
    const start = text.slice(0, halfLength);
    const end = text.slice(-halfLength);
    
    return `${start}...${end}`;
  }

  // Helper function to strip HTML tags for typing animation
  const stripHtml = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    return doc.body.textContent || ""
  }

  // Add this helper function to handle copying text
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optionally show some feedback that text was copied
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const styles = {
    popup: {
      width: "300px",
      height: "auto",
      padding: 20,
      background: "#E9E9E9",
      border: "1px solid #D5D5D5",
      borderRadius: 12,
      boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
      maxWidth: 500,
      fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      maxHeight: "400px",
      overflow: "auto"
    },
    buttonContainer: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      position: "absolute",
      top: 12,
      right: 12,
      height: "fit-content",
      minHeight: 40, // This gives space for the buttons
      zIndex: 9999
    },
    buttonContainerParent:{
      marginBottom: 32,
     
    },
    button: {
      width:19,
      border: "none",
      background: "none",
      cursor: "pointer",
      padding: 4,
      fontFamily: "'K2D', sans-serif"
    },
    text: {
      fontSize: 14,
      lineHeight: 1.5,
      margin: "0 0 16px 0",
      color: "#000",
      fontFamily: "'K2D', sans-serif"
    },
    explanation: {
      fontSize: 12,
      lineHeight: 1.6,
      color: "#333",
      backgroundColor: "#f5f5f5",
      padding: 12,
      borderRadius: 8,
      marginTop: 16,
      fontFamily: "'K2D', sans-serif",
      willChange: 'transform, opacity',
      transformOrigin: 'top',
      whiteSpace: 'pre-wrap',
      overflow: 'hidden', // Ensures smooth animation containment
      '& span': {
        display: 'inline-block',
        willChange: 'transform, opacity'
      },
      marginBottom: 16, // Add space between initial explanation and follow-ups
    },
    followUpQA: {
      borderTop: "1px solid #ddd",
      marginTop: 12,
      paddingTop: 12
    },
    error: {
      color: 'red',
      fontSize: 14,
      marginTop: 8,
      fontFamily: "'K2D', sans-serif"
    },
    loadingText: {
      fontFamily: "'K2D', sans-serif",
      fontSize: 14,
      color: "#666",
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    searchContainer: {
      marginTop: 16,
      width: "95%",
      display: "flex",
      flexDirection: "row",
      gap: 8,
      fontFamily: "'K2D', sans-serif",
      backgroundColor: "#2C2C2C",
      padding: "8px",
      borderRadius: "31px",
    },
    searchSendButton: {
      backgroundColor: "#2C2C2C",
    },
    input: {
      flex: 1,
      padding: "8px 12px",
      border: "none",
      fontSize: 14,
      fontFamily: "'K2D', sans-serif",
      backgroundColor: "transparent",
      color: "white",
      outline: "none",
      "&::placeholder": {
        color: "#666"
      }
    },
    askButton: {
      padding: "8px 16px",
      backgroundColor: "#565656",
      color: "white",
      border: "none",
      cursor: "pointer",
      fontSize: 14,
      fontFamily: "'K2D', sans-serif",
      minWidth: "fit-content",
      borderRadius: "23px",
      "&:hover": {
        opacity: 0.8
      }
    },
    followUpText: {
      fontSize: 14,
      color: "#666",
      marginTop: 8,
      fontFamily: "'K2D', sans-serif",
      fontStyle: "italic"
    },
    cursor: {
      display: 'inline-block',
      width: '2px',
      height: '1em',
      backgroundColor: '#333',
      verticalAlign: 'middle',
      marginLeft: '2px',
      animation: 'blink 1s step-end infinite'
    },
    followUpContainer: {
      marginTop: 16,
      padding: 12,
      borderTop: "1px solid #ddd",
      background: "#f5f5f5",
      borderRadius: 8,
    },
    followUpQuestion: {
      fontSize: 12,
      fontWeight: "bold",
      marginBottom: 8,
      color: "#333",
      fontFamily: "'K2D', sans-serif",
    },
    followUpAnswer: {
      fontSize: 12,
      lineHeight: 1.6,
      color: "#333",
      fontFamily: "'K2D', sans-serif",
      whiteSpace: 'pre-wrap',
    },
    feedbackContainer: {
      display: 'flex',
      gap: '8px',
      justifyContent: 'flex-start',
      marginTop: '8px'
    },
    feedbackButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      transition: 'all 0.2s ease'
    }
  }

  const textVariants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3
      }
    }
  }

  const loadingVariants = {
    animate: {
      opacity: [0.3, 1, 0.3],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const iconButtonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.2,
      rotate: 10,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    }
  }

  const renderConfigurationWarning = () => {
    if (!isConfigured) {
      return (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          zIndex: 10000
        }}>
          ⚠️ Extension not configured. Please visit the options page to set it up.
        </div>
      );
    }
    return null;
  };

  // First, update the variants to be simpler
  const popupVariants = {
    initial: {
      opacity: 0,
      scale: 0.9,
      transition: {
        type: "spring",
        duration: 0.3,
      }
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        duration: 0.3,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.2,
      }
    }
  }

  // Add this to handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isVisible) {
        // Recalculate position when window is resized
        const { top, left } = calculatePosition(position.x, position.y);
        setPosition({
          x: parseInt(left),
          y: parseInt(top)
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isVisible, position]);

  const handleFeedback = async (id: string, text: string, type: 'like' | 'dislike') => {
    const feedback = {
      id,
      text,
      feedback: type,
      context: selectedText,
      timestamp: Date.now()
    };

    // Store feedback
    const existingFeedbacks = await storage.get('feedbacks') || [];
    await storage.set('feedbacks', [...existingFeedbacks, feedback]);
    
    // Update UI state
    setFeedbacks(prev => ({
      ...prev,
      [id]: type
    }));
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <div style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}>
          <div style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            pointerEvents: 'auto',
            maxHeight: '80vh',
            // overflowY: 'auto',
          }}>
            <motion.div 
              style={styles.popup}
              data-plasmo-popup
              className="no-select"
              onClick={(e) => e.stopPropagation()}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={popupVariants}
              layout
            >
              <div style={styles.buttonContainerParent}>
                <div>
                  {Logo()}
                </div>
                <div style={styles.buttonContainer}>
                  <motion.button 
                    style={{...styles.button, color: 'black'}}
                    variants={iconButtonVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    {PinIcon()}
                  </motion.button>
                  <motion.button 
                    onClick={() => setIsVisible(false)}
                    style={{...styles.button, color: 'black'}}
                    variants={iconButtonVariants}
                    initial="initial"
                    whileHover="hover"
                  >
                    {CloseIcon()}
                  </motion.button>
                </div>
              </div>
              <p style={{...styles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline'}}>{truncateText(selectedText)}</p>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.p
                    key="loading"
                    style={styles.loadingText}
                    variants={loadingVariants}
                    animate="animate"
                  >
                    Generating {mode}...
                  </motion.p>
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
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                    >
                      {explanation && (
                        <>
                          <TypewriterText 
                            key="initial-explanation"
                            text={stripHtml(explanation)} 
                            speed={30}
                            stopAnimation={activeAnswerId !== null}
                          />
                          <motion.div 
                            style={styles.feedbackContainer}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <motion.button
                              onClick={() => handleCopy(stripHtml(explanation))}
                              style={{
                                ...styles.feedbackButton,
                                color: '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg width="13" height="13" viewBox="0 0 62 61" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
</svg>

                            </motion.button>
                            <motion.button
                              onClick={() => handleFeedback('initial', explanation, 'like')}
                              style={{
                                ...styles.feedbackButton,
                                color: feedbacks['initial'] === 'like' ? '#0F8A5F' : '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg width="13" height="13" viewBox="0 0 60 66" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M26.6108 5.3736C25.764 7.54084 25.3317 10.0211 24.6313 12.611C23.4279 17.0604 21.7389 21.5198 17.1143 24.4812C16.6115 23.4546 15.9293 22.5592 15.1098 21.8767C13.4022 20.4546 11.2762 19.8232 9.17144 19.8232C7.0667 19.8232 4.91561 20.4546 3.208 21.8767C1.5004 23.299 0.351562 25.5931 0.351562 28.2376V53.08C0.351562 55.7245 1.5004 57.9937 3.208 59.4158C4.91561 60.8381 7.0667 61.4944 9.17144 61.4944C11.2762 61.4944 13.4022 60.8381 15.1098 59.4158C15.5279 59.0677 15.9177 58.6566 16.2624 58.2137C17.4974 59.1358 18.7774 59.8227 19.9958 60.1667C26.3043 62.0641 30.1481 64.2363 42.672 65.05C45.6787 65.0908 48.8912 64.4278 51.2412 63.3468C53.8736 62.1009 56.277 59.8363 56.7536 56.5853C57.5593 51.0892 59.2318 42.9913 59.6101 36.2506C59.7649 33.4891 59.4837 30.721 57.8812 28.3871C56.2941 26.0758 53.4946 24.5999 49.813 24.1298C46.2134 23.6486 42.2725 23.6761 39.0888 23.8794C41.1656 19.0706 42.7735 14.4192 42.6969 10.3563C42.6489 7.80672 41.9122 5.31376 40.0409 3.54473C38.1852 1.79028 35.4935 0.97847 32.2484 0.965332C28.8408 0.981354 27.4411 3.36224 26.6108 5.3736ZM32.1733 5.77446C34.6886 5.77446 36.0097 6.34218 36.7336 7.02654C37.4574 7.71099 37.8536 8.73124 37.8862 10.4574C37.6607 13.8029 35.2552 21.8166 31.4717 29.1143C38.4625 29.0289 43.905 28.1964 49.1365 28.8889C52 29.2376 53.2121 30.0582 53.9223 31.0927C54.6326 32.127 54.924 33.7774 54.7993 36.0011C54.4543 42.1487 52.8368 50.1289 51.993 55.885C51.7966 57.2241 50.9224 58.1687 49.1866 58.9903C47.4703 59.8027 45.0549 60.2576 42.8975 60.2675C30.8373 59.4754 28.0705 57.5713 21.2487 55.5344C18.9022 54.7338 18.0362 53.0605 18.0164 51.4023C17.9897 44.0898 17.9914 36.7773 17.9914 29.4648C25.1227 25.7173 27.8483 19.1081 29.2668 13.8632C30.3578 10.3696 30.7803 5.78719 32.1733 5.77446Z" fill="currentColor"/>
                              </svg>
                            </motion.button>
                            <motion.button
                              onClick={() => handleFeedback('initial', explanation, 'dislike')}
                              style={{
                                ...styles.feedbackButton,
                                color: feedbacks['initial'] === 'dislike' ? '#ff4444' : '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <svg width="13" height="13" viewBox="0 0 57 62" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M31.5374 57.716C32.3451 55.6216 32.7575 53.2247 33.4256 50.7219C34.5735 46.422 36.1847 42.1125 40.596 39.2507C41.0757 40.2428 41.7264 41.108 42.5081 41.7676C44.137 43.142 46.165 43.7521 48.1727 43.7521C50.1804 43.7521 52.2323 43.142 53.8612 41.7676C55.4901 40.3932 56.5859 38.1762 56.5859 35.6205L56.5859 11.6132C56.5859 9.05756 55.4901 6.8647 53.8612 5.49035C52.2323 4.11592 50.1804 3.48165 48.1727 3.48165C46.165 3.48165 44.137 4.11584 42.5081 5.49035C42.1093 5.8268 41.7375 6.22409 41.4087 6.65204C40.2307 5.76099 39.0096 5.09715 37.8474 4.76473C31.8297 2.93107 28.1632 0.83196 16.2167 0.0455745C13.3486 0.00609211 10.2843 0.646858 8.0426 1.6915C5.53153 2.89554 3.23898 5.08399 2.78433 8.22573C2.0158 13.5371 0.420395 21.3628 0.0595847 27.8769C-0.0881129 30.5456 0.180144 33.2206 1.70877 35.4761C3.22269 37.7097 5.89311 39.1359 9.40496 39.5902C12.8386 40.0552 16.5977 40.0287 19.6347 39.8322C17.6536 44.4794 16.1199 48.9744 16.1929 52.9008C16.2387 55.3647 16.9415 57.7738 18.7265 59.4834C20.4967 61.1788 23.0643 61.9634 26.1597 61.9761C29.4102 61.9606 30.7453 59.6597 31.5374 57.716ZM26.2314 57.3286C23.8321 57.3286 22.5718 56.78 21.8813 56.1186C21.1908 55.4572 20.8129 54.4712 20.7819 52.8031C20.997 49.57 23.2915 41.8257 26.9006 34.7733C20.2322 34.8559 15.0406 35.6604 10.0502 34.9911C7.31877 34.6541 6.16259 33.8611 5.48509 32.8614C4.80758 31.8619 4.52961 30.2669 4.64854 28.118C4.97762 22.177 6.52059 14.4651 7.32549 8.9025C7.51276 7.60842 8.34671 6.69554 10.0024 5.90157C11.6396 5.1165 13.9436 4.67686 16.0016 4.66727C27.5057 5.43275 30.145 7.27283 36.6523 9.24135C38.8906 10.015 39.7166 11.632 39.7356 13.2345C39.761 20.3012 39.7594 27.3679 39.7594 34.4346C32.9569 38.0561 30.357 44.4431 29.0039 49.5118C27.9631 52.8879 27.5602 57.3163 26.2314 57.3286Z" fill="currentColor"/>
                              </svg>
                            </motion.button>
                            
                          </motion.div>
                        </>
                      )}
                    </motion.div>

                    {followUpQAs.map((qa, index) => (
                      <motion.div
                        key={qa.id}
                        style={styles.followUpContainer}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <div style={styles.followUpQuestion}>Q: {qa.question}</div>
                        <div style={styles.followUpAnswer}>
                          <TypewriterText 
                            key={qa.id}
                            text={stripHtml(qa.answer)}
                            speed={30}
                            stopAnimation={activeAnswerId !== null && activeAnswerId !== qa.id}
                          />
                        </div>
                      </motion.div>
                    ))}

                    <motion.div 
                      style={styles.searchContainer}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        transition: { delay: 0.2 }
                      }}
                    >
                      <input 
                        placeholder="Ask LightUp"
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        style={styles.input}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAskFollowUp()
                          }
                        }}
                      />
                      <button  
                        onClick={handleAskFollowUp}
                        disabled={isAskingFollowUp || !followUpQuestion.trim()}
                        style={{
                          ...styles.askButton,
                          opacity: isAskingFollowUp || !followUpQuestion.trim() ? 0.6 : 1
                        }}
                      >
                        {isAskingFollowUp ? '...' : '↑'}
                      </button>
                    </motion.div>
                    
                    {isAskingFollowUp && (
                      <motion.p
                        style={styles.followUpText}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Getting your answer...
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default Content

