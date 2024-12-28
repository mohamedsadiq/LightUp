import type { MotionStyle } from "framer-motion"

export const flexMotionStyle: MotionStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: '12px',
  width: '100%'
};

export const followUpMotionStyle: MotionStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: '12px',
  width: '100%'
};

export const popupMotionVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.1 
  },
  animate: { 
    opacity: 1, 
    scale: 1 
  },
  exit: { 
    scale: 0.5, 
    opacity: 0 
  }
};

export const toastMotionVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0 
  },
  exit: { 
    opacity: 0, 
    y: 20 
  }
}; 