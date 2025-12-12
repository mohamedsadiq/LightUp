import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { FontSizes } from "../../styles"

// Loading Thinking Text Component with alternating words
interface LoadingThinkingTextProps {
  currentTheme: 'light' | 'dark' | 'system';
  fontSizes: FontSizes;
  onCycleComplete?: () => void;
}

// Inject gradient shift keyframes once
const injectGradientKeyframes = () => {
  const id = "lightup-gradient-keyframes";
  if (document.getElementById(id)) return; // already added

  const style = document.createElement("style");
  style.id = id;
  style.textContent = `@keyframes lightupGradientShift {
    0% { background-position: 0% 50%; }
    100% { background-position: 100% 50%; }
  }`;
  document.head.appendChild(style);
};

export const LoadingThinkingText = React.memo(({ currentTheme, fontSizes, onCycleComplete }: LoadingThinkingTextProps) => {
  const [currentWord, setCurrentWord] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const words = ['Forming', 'Generating'];
  
  // Ensure keyframes are present
  useEffect(() => {
    injectGradientKeyframes();
  }, []);
  
  useEffect(() => {
    // Clear any existing intervals/timeouts
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
    }
    if (fadeOutTimeoutRef.current) {
      clearTimeout(fadeOutTimeoutRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setCurrentWord(prev => {
        const nextWord = (prev + 1) % words.length;
        
        // If we're going back to the first word, increment cycle count
        if (nextWord === 0) {
          setCycleCount(prevCount => {
            const newCount = prevCount + 1;
            
            // Start completion process after first full rotation
            if (newCount === 1) {
              setIsCompleting(true);
              
              // Clear the interval to stop word switching
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              
              // Wait for the current word to display, then start fade out
              completionTimeoutRef.current = setTimeout(() => {
                setIsFadingOut(true);
                
                // Wait for fade out animation to complete, then call onCycleComplete
                fadeOutTimeoutRef.current = setTimeout(() => {
                  if (onCycleComplete) {
                    onCycleComplete();
                  }
                }, 400); // Fade out duration
              }, 600); // Display final word duration
            }
            
            return newCount;
          });
        }
        
        return nextWord;
      });
    }, 1800); // Slightly longer interval for better readability
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
      }
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
      }
    };
  }, [onCycleComplete]);
  
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
          key={`${currentWord}-${cycleCount}`}
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