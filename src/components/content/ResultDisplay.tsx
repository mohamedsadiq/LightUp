import { motion } from "framer-motion"
import TypewriterText from "./TypewriterText"

interface ResultDisplayProps {
  result: string
  onClose: () => void
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  onClose
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={styles.container}
     
    >
      <TypewriterText text={result} />
      <motion.button onClick={onClose} style={styles.closeButton} 
       transition={{ 
        type: "spring",
        bounce: 0.1,
        stiffness: 120,
        damping: 10
      }}
      layout
      >
        Close
      </motion.button>
    </motion.div>
  )
}

const styles = {
  container: {
    position: 'fixed' as const,
    bottom: 20,
    right: 20,
    maxWidth: '400px',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    zIndex: 9999
  },
  closeButton: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666'
  }
} 