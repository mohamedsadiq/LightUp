export const textVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
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

export const loadingSkeletonVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    transform: 'translateZ(0)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    transform: 'translateZ(0)',
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.02,
      delayChildren: 0.05,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: {
      duration: 0.25,
      ease: [0.4, 0.0, 0.2, 1],
      staggerChildren: 0.015,
      staggerDirection: -1
    }
  }
}

export const skeletonLineVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    rotateX: -5,
    transform: 'translateZ(0)',
  },
  animate: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    rotateX: 0,
    transform: 'translateZ(0)',
    transition: {
      duration: 0.35,
      delay: i * 0.025,
      ease: [0.25, 0.46, 0.45, 0.94],
      opacity: {
        duration: 0.25,
        ease: "easeOut"
      },
      scale: {
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1]
      },
      y: {
        duration: 0.35,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  }),
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -4,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

export const shimmerVariants = {
  initial: {
    backgroundPosition: "-200% 0"
  },
  animate: {
    backgroundPosition: "200% 0",
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear",
      repeatDelay: 0.3
    }
  }
}

export const enhancedShimmerVariants = {
  initial: {
    x: "-100%",
    opacity: 0
  },
  animate: {
    x: "100%",
    opacity: [0, 1, 1, 0],
    transition: {
      repeat: Infinity,
      duration: 1.2,
      ease: "easeInOut",
      times: [0, 0.1, 0.9, 1],
      repeatDelay: 0.4
    }
  }
}

export const loadingVariants = {
  animate: {
    opacity: [0.4, 1, 0.4],
    scale: [0.95, 1.05, 0.95],
    y: [0, -2, 0],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.5, 1]
    }
  }
}

export const loadingDotsVariants = {
  initial: {
    scale: 0.8,
    opacity: 0.4
  },
  animate: {
   
    opacity: [0.4, 1, 0.4],
    transition: {
      duration: 1.2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

export const pulseVariants = {
  initial: {
    scale: 1,
    opacity: 0.95,
    transform: 'translateZ(0)',
  },
  animate: {
    scale: [1, 1.005, 1],
    opacity: [0.95, 1, 0.95],
    transform: 'translateZ(0)',
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: [0.4, 0.0, 0.6, 1],
      repeatType: "reverse" as const
    }
  }
}

export const iconButtonVariants = {
  initial: { 
    opacity: 0,
    scale: 0.1
  },
  animate: { 
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 10,
      mass: 0.8
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  },
  hover: { 
    scale: 1.1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 10
    }
  }
}

export const popupVariants = {
  initial: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    }
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.2,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.15,
    }
  }
}

export const tooltipVariants = {
  initial: { 
    opacity: 0,
    y: 10,
    scale: 0.8
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  },
  exit: {
    opacity: 0,
    y: 10,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
}

export const feedbackButtonVariants = {
  initial: { 
    scale: 1,
   
  },
  hover: { 
    scale: 1.2,
    // backgroundColor: '#e9e9e9',
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
      mass: 0.8
    }
  },
  tap: { 
    scale: 0.8,
    transition: {
   
      type: "spring",
      stiffness: 400,
      damping: 10
    }
  },
  bounce: {
    scale: [1, 1.3, 1],
    transition: {
     
      type: "spring",
      stiffness: 300,
      damping: 10
    }
  }
}

export const fadeVariants = {
  initial: {
    opacity: 0,
    transform: 'translateZ(0)',
  },
  animate: {
    opacity: 1,
    transform: 'translateZ(0)',
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

export const containerVariants = {
  initial: {
    opacity: 0,
    scale: 0.99,
    transform: 'translateZ(0)',
  },
  animate: {
    opacity: 1,
    scale: 1,
    transform: 'translateZ(0)',
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
      staggerChildren: 0.02,
      delayChildren: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: {
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}