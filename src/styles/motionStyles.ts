import type { MotionStyle } from "framer-motion"

const SIDEBAR_SLIDE_DURATION = 0.18
const sidebarSlideTransition = {
  type: "tween",
  duration: SIDEBAR_SLIDE_DURATION,
  ease: "easeOut" as const
}

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

export const slideMotionVariants = {
  initial: {
    opacity: 0,
    y: -20,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
      mass: 0.8
    }
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 40,
      mass: 1
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
      mass: 0.8
    }
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
    x: '100vw',
    opacity: 1,
    transition: sidebarSlideTransition
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: sidebarSlideTransition
  },
  exit: {
    x: '100vw',
    opacity: 1,
    transition: sidebarSlideTransition
  }
};

export const sidebarReducedMotionVariants = {
  initial: {
    x: 0,
    opacity: 0
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      opacity: {
        duration: SIDEBAR_SLIDE_DURATION,
        ease: "easeOut"
      },
      x: {
        duration: 0
      }
    }
  },
  exit: {
    x: 0,
    opacity: 0,
    transition: {
      opacity: {
        duration: SIDEBAR_SLIDE_DURATION,
        ease: "easeOut"
      },
      x: {
        duration: 0
      }
    }
  }
}

export const fadeMotionVariants = {
  initial: {
    opacity: 0,

  },
  animate: {
    opacity: 1,

  },
  exit: {
    opacity: 0,

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
    opacity: 1
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