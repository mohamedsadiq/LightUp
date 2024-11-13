// Add this new component
import { useState, useEffect } from "react"
import { motion, AnimatePresence, usePresence } from "framer-motion"

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

  export default TypewriterText