import { motion } from "framer-motion"
import type { Mode } from "~types/settings"

interface ActionButtonProps {
  mode: Mode
  activeMode: Mode
  onClick: () => void
  children: React.ReactNode
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  mode,
  activeMode,
  onClick,
  children
}) => {
  return (
    <motion.button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        backgroundColor: activeMode === mode ? "#0F8A5F" : "#e2e2e2",
        color: activeMode === mode ? "#ffffff" : "#000",
        border: "none",
        borderRadius: "20px",
        cursor: "pointer",
        fontSize: "14px"
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.button>
  )
} 