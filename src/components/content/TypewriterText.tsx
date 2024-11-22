import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { marked } from 'marked';

marked.setOptions({ async: false });

interface TypewriterTextProps {
  text: string;
  speed?: number;
  stopAnimation?: boolean;
  animationType?: 'typewriter' | 'fade' | 'slide' | 'scale';
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 20,
  stopAnimation = false,
  animationType = 'typewriter'
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [previousText, setPreviousText] = useState(text);

  // Animation variants for non-typewriter animations
  const textVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: animationType === 'scale' ? 0.8 : 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        scale: {
          type: "spring",
          stiffness: 200,
          damping: 20
        }
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: animationType === 'scale' ? 0.8 : 1,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  useEffect(() => {
    if (text === previousText && isAnimationComplete) return;
    setPreviousText(text);
    
    if (animationType !== 'typewriter' || stopAnimation) {
      const formattedText = marked.parse(text) as string;
      setDisplayedText(formattedText);
      setIsAnimationComplete(true);
      return;
    }

    // Original typewriter logic
    setDisplayedText('');
    setIsAnimationComplete(false);
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex < text.length) {
        const formattedText = marked.parse(text.substring(0, currentIndex + 1)) as string;
        setDisplayedText(formattedText);
        currentIndex++;
      } else {
        clearInterval(intervalId);
        setIsAnimationComplete(true);
      }
    }, speed);

    return () => clearInterval(intervalId);
  }, [text, speed, stopAnimation, animationType]);

  if (animationType === 'typewriter') {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: displayedText }} 
        style={{ lineHeight: '1.7em', whiteSpace: 'normal' }} 
      />
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={text}
        variants={textVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        dangerouslySetInnerHTML={{ __html: displayedText }}
        style={{ lineHeight: '1.7em', whiteSpace: 'normal' }}
      />
    </AnimatePresence>
  );
};

export default TypewriterText;