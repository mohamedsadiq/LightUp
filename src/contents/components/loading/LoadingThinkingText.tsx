import React, { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { FontSizes } from "../../styles"

// Loading Thinking Text Component with alternating words
interface LoadingThinkingTextProps {
  currentTheme: 'light' | 'dark' | 'system';
  fontSizes: FontSizes;
  onCycleComplete?: () => void;
}

// Inject gradient shift keyframes once (cached)
let keyframesInjected = false;
const injectGradientKeyframes = () => {
  if (keyframesInjected) return;
  
  const style = document.createElement("style");
  style.id = "lightup-gradient-keyframes";
  style.textContent = `@keyframes lightupGradientShift {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }`;
  document.head.appendChild(style);
  keyframesInjected = true;
};

export const LoadingThinkingText = React.memo(({ currentTheme, fontSizes, onCycleComplete }: LoadingThinkingTextProps) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const cycleCountRef = useRef(0);
  const onCycleCompleteRef = useRef(onCycleComplete);
  const words = ['Forming', 'Generating'];
  
  // Keep callback ref updated
  useEffect(() => {
    onCycleCompleteRef.current = onCycleComplete;
  }, [onCycleComplete]);
  
  // Ensure keyframes are present (runs once)
  useEffect(() => {
    injectGradientKeyframes();
  }, []);
  
  // Use requestAnimationFrame for word cycling instead of setInterval
  useEffect(() => {
    const wordDuration = 1800; // ms per word
    const fadeOutDelay = 600;
    const fadeOutDuration = 400;
    
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      
      // Calculate which word to show based on elapsed time
      const wordIndex = Math.floor(elapsed / wordDuration) % words.length;
      const cycleNumber = Math.floor(elapsed / (wordDuration * words.length));
      
      // Update word if changed
      setCurrentWord(prev => {
        if (prev !== wordIndex) return wordIndex;
        return prev;
      });
      
      // Check if we completed first cycle
      if (cycleNumber >= 1 && cycleCountRef.current === 0) {
        cycleCountRef.current = 1;
        setIsCompleting(true);
        
        // Schedule fade out
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onCycleCompleteRef.current?.();
          }, fadeOutDuration);
        }, fadeOutDelay);
        
        return; // Stop animation loop
      }
      
      // Continue animation if not completing
      if (cycleCountRef.current === 0) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      startTimeRef.current = null;
      cycleCountRef.current = 0;
    };
  }, []);
  
  return (
    <motion.div
      initial={{ opacity: 0, filter: 'blur(4px)', y: 5 }}
      animate={{ 
        opacity: isFadingOut ? 0 : (isCompleting ? 0.8 : 1), 
        filter: isFadingOut ? 'blur(8px)' : 'blur(0px)', 
        y: isFadingOut ? -10 : 0,
        scale: isFadingOut ? 0.9 : (isCompleting ? 0.98 : 1)
      }}
      exit={{ 
        opacity: 0, 
        filter: 'blur(4px)', 
        y: -5,
        scale: 0.95,
        transition: { 
          duration: 0.4,
          ease: "easeInOut"
        }
      }}
      transition={{ 
        duration: 0.6,
        type: "spring",
        stiffness: 120,
        damping: 15
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '6px',
        color: currentTheme === "dark" ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        fontSize: '16px',
        fontWeight: '500',
        textAlign: 'left',
        marginTop: '12px',
        letterSpacing: '0.3px',
        marginBottom: '15px'
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={`${currentWord}-${cycleCountRef.current}`}
          initial={{ 
            opacity: 0, 
            filter: 'blur(6px)', 
            y: 12, 
            x: 0,
            scale: 0.95
          }}
          animate={{ 
            opacity: isFadingOut ? 0 : (isCompleting ? 0.7 : 1), 
            filter: isFadingOut ? 'blur(12px)' : 'blur(0px)', 
            y: isFadingOut ? -8 : 0, 
            x: 0,
            scale: isFadingOut ? 0.85 : 1,
            backgroundPosition: ['0% 50%', '100% 50%']
          }}
          exit={{ 
            opacity: 0, 
            filter: 'blur(6px)', 
            y: -8, 
            x: 0,
            scale: 0.95
          }}
          transition={{ 
            duration: 0.3, 
            ease: 'easeInOut',
            filter: { duration: 0.15 },
            scale: { duration: 0.2 },
            backgroundPosition: {
              duration: 2.5,
              repeat: Infinity,
              ease: 'linear'
            }
          }}
          style={{
            backgroundImage: currentTheme === "dark"
              ? 'linear-gradient(90deg, #ffffff 0%, #505050 50%, #ffffff 100%)'
              : 'linear-gradient(90deg, #c0c0c0 0%, #161616 50%, #c0c0c0 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            WebkitTextFillColor: 'transparent',
            display: 'inline-block',
            backgroundPosition: '0% 50%'
          }}
        >
          {words[currentWord]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
});

LoadingThinkingText.displayName = 'LoadingThinkingText'; 