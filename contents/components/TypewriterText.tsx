import { useState, useEffect } from "react"
import { motion, usePresence } from "framer-motion"

interface TypewriterTextProps {
  text: string;
  speed?: number;
  stopAnimation?: boolean;
}

export const TypewriterText = ({ text, speed = 100, stopAnimation = false }: TypewriterTextProps) => {
  const [displayedText, setDisplayedText] = useState("")
  const [isPresent, safeToRemove] = usePresence()
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (stopAnimation) {
      setDisplayedText(text)
      return
    }

    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1))
        setCurrentIndex(currentIndex + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed, stopAnimation])

  useEffect(() => {
    if (!isPresent) {
      setTimeout(safeToRemove, 1000)
    }
  }, [isPresent, safeToRemove])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {displayedText}
    </motion.div>
  )
} 