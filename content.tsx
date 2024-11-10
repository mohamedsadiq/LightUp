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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.querySelector('[data-plasmo-popup]')
      if (popup && !popup.contains(event.target as Node)) {
        setIsVisible(false)
      }
    }

    const handleMouseUp = async (event: MouseEvent) => {
      if (!isConfigured) {
        setError("Please configure the extension in the options page first.");
        return;
      }

      const selection = window.getSelection()
      const text = selection?.toString().trim()

      if (text && text.length > 0 && /[a-zA-Z0-9]/.test(text)) {
        setSelectedText(text)
        setPosition({
          x: event.pageX,
          y: event.pageY
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

  const styles = {
    popup: {
      width: "300px",
      height: "auto",
      padding: 20,
      background: "#E9E9E9",
      border: "1px solid #D5D5D5",
      borderRadius: 12,
      boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
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
            position: 'absolute',
            left: `${position.x}px`,
            top: `${position.y + 20}px`,
            pointerEvents: 'auto',
          }}>
            <motion.div 
              style={styles.popup}
              data-plasmo-popup
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
                        <TypewriterText 
                          key="initial-explanation"
                          text={stripHtml(explanation)} 
                          speed={30}
                          stopAnimation={activeAnswerId !== null}
                        />
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

