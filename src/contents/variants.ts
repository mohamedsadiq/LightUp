export const textVariants = {
  initial: { 
    opacity: 0, 
    y: 20 
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

export const loadingVariants = {
  animate: {
    opacity: [0.3, 1, 0.3],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
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