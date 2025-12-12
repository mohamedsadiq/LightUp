import React from "react"
import { motion } from "framer-motion"
import { PinIcon, UnpinIcon } from "../icons/index"
import type { Theme } from "~types/theme"

interface PinButtonProps {
  isPinned: boolean;
  onTogglePin: () => void;
  layoutMode: string;
  theme: Theme;
  themedStyles: any;
}

const iconButtonVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
}

export const PinButton: React.FC<PinButtonProps> = ({
  isPinned,
  onTogglePin,
  layoutMode,
  theme,
  themedStyles
}) => {
  // Only show pin button in sidebar mode
  if (layoutMode !== "sidebar") {
    return null;
  }

  const iconColor = theme === "dark" ? "#FFFFFF" : "#000000";

  return (
    <motion.button
      onClick={onTogglePin}
      style={{
        ...themedStyles.button,
        marginTop: '2px',
        marginRight: '8px',
        color: iconColor,
        opacity: isPinned ? 1 : 0.5
      }}
      animate={{ rotate: isPinned ? -44 : 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      variants={iconButtonVariants}
      whileHover="hover"
      whileTap="tap"
      title={isPinned ? "Unpin sidebar" : "Pin sidebar"}
    >
      {isPinned ? <PinIcon /> : <PinIcon />}
    </motion.button>
  );
}; 