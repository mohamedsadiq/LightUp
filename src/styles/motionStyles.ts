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

export const scaleMotionVariants = {
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

export const sidebarScaleMotionVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.1,
    x: 150
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    x: 0
  },
  exit: { 
    scale: 0.5, 
    opacity: 0,
    x: 150
  }
};

export const sidebarSlideMotionVariants = {
  initial: { 
    opacity: 0,
    x: 150
  },
  animate: { 
    opacity: 1,
    x: 0
  },
  exit: { 
    opacity: 0,
    x: 150
  }
};

export const fadeMotionVariants = {
  initial: { 
    opacity: 0
  },
  animate: { 
    opacity: 1
  },
  exit: { 
    opacity: 0
  }
};

export const noMotionVariants = {
  initial: { 
    opacity: 1
  },
  animate: { 
    opacity: 1
  },
  exit: { 
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