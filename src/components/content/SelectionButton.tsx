import { motion } from "framer-motion"
import { Logo } from "../icons"

interface SelectionButtonProps {
  position: { x: number, y: number }
  onClick: () => void
  theme?: "light" | "dark"
}

export const SelectionButton: React.FC<SelectionButtonProps> = ({ position, onClick, theme = "light" }) => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 9999,
        padding: 0
      }}
    >
      {Logo(theme)}
    </motion.button>
  )
} 