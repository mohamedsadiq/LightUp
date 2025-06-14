import React, { useMemo, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { debounce } from "../../utils/debounce"
import type { FontSizes } from "../../styles"

interface FollowUpInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement>;
  followUpQuestion: string;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAskFollowUpWrapper: () => void;
  isAskingFollowUp: boolean;
  setIsInputFocused: (focused: boolean) => void;
  themedStyles: any; // Use the actual type if available
  currentTheme: "light" | "dark";
  fontSizes: FontSizes; // Now properly typed
}

export const FollowUpInput = React.memo(({ 
  inputRef, 
  followUpQuestion, 
  handleFollowUpQuestion, 
  handleAskFollowUpWrapper, 
  isAskingFollowUp, 
  setIsInputFocused,
  themedStyles,
  currentTheme,
  fontSizes
}: FollowUpInputProps) => {
  // Optimized constants
  const INITIAL_HEIGHT = parseFloat(fontSizes.base) * 16 * 1.5; // Convert rem to px and add line height
  const MAX_HEIGHT = INITIAL_HEIGHT * 2;
  
  // Memoized styles to prevent recalculation
  const textareaStyle = useMemo(() => ({
    ...themedStyles.input,
    opacity: isAskingFollowUp ? 0.7 : 1,
    resize: 'none' as const,
    height: `21.2px`,
    lineHeight: "20px",
    padding: '1px 8px',
    display: 'block' as const,
    transition: 'opacity 0.2s ease, height 0.1s ease',
    fontSize: '1rem',
    textAlign: 'left' as const,
  }), [themedStyles.input, isAskingFollowUp, INITIAL_HEIGHT, fontSizes]);

  const containerStyle = useMemo(() => ({
    ...themedStyles.followUpInputContainer,
    marginTop: '8px',
    marginBottom: '16px',
    paddingTop: '8px',
  }), [themedStyles.followUpInputContainer]);

  // Optimized auto-resize with debouncing and minimal DOM manipulation
  const autoResizeTextarea = useCallback(
    debounce(() => {
      const textarea = inputRef.current;
      if (!textarea) return;
      
      // Use requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        // Only manipulate DOM if content actually changed
        const currentHeight = parseInt(textarea.style.height) || INITIAL_HEIGHT;
        
        // Reset height to measure content
        textarea.style.height = 'auto';
        const scrollHeight = textarea.scrollHeight;
        const newHeight = Math.max(INITIAL_HEIGHT, Math.min(scrollHeight, MAX_HEIGHT));
        
        // Only update if height actually changed
        if (currentHeight !== newHeight) {
          textarea.style.height = `${newHeight}px`;
          
          // Update overflow only when necessary
          const shouldShowScroll = scrollHeight > MAX_HEIGHT;
          const currentOverflow = textarea.style.overflowY;
          const newOverflow = shouldShowScroll ? 'auto' : 'hidden';
          
          if (currentOverflow !== newOverflow) {
            textarea.style.overflowY = newOverflow;
          }
        } else {
          // Restore height if no change needed
          textarea.style.height = `${currentHeight}px`;
        }
      });
    }, 16), // ~60fps
    [INITIAL_HEIGHT, MAX_HEIGHT]
  );

  // Optimized change handler
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleFollowUpQuestion(e);
    autoResizeTextarea();
  }, [handleFollowUpQuestion, autoResizeTextarea]);

  // Optimized key handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey && !isAskingFollowUp) {
      e.preventDefault();
      if (followUpQuestion.trim()) {
        handleAskFollowUpWrapper();
      }
    }
  }, [followUpQuestion, handleAskFollowUpWrapper, isAskingFollowUp]);

  // Optimized focus handlers
  const handleFocus = useCallback(() => setIsInputFocused(true), [setIsInputFocused]);
  const handleBlur = useCallback(() => setIsInputFocused(false), [setIsInputFocused]);

  // Initial resize on mount and theme change only
  useEffect(() => {
    autoResizeTextarea();
  }, [currentTheme, autoResizeTextarea]);

  // Memoized button content
  const buttonContent = useMemo(() => {
    if (isAskingFollowUp) {
      return (
        <motion.svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      );
    }
    
    return (
      <motion.svg 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none"
        initial={{ scale: 1 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </motion.svg>
    );
  }, [isAskingFollowUp]);

  return (
    <div style={containerStyle}>
      <div style={themedStyles.searchContainer} className="lu-search-container">
        <textarea
          ref={inputRef}
          value={followUpQuestion}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          style={textareaStyle}
          disabled={isAskingFollowUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={1}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="text"
          className="lu-optimized-textarea lu-centered-placeholder"
        />
        <motion.button
          onClick={handleAskFollowUpWrapper}
          disabled={!followUpQuestion.trim() || isAskingFollowUp}
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          animate={isAskingFollowUp ? { scale: 0.9, opacity: 0.7 } : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={themedStyles.searchSendButton}
          className="lu-search-send-button"
          title={!followUpQuestion.trim() ? "Type a question first" : isAskingFollowUp ? "Sending..." : "Send message"}
        >
          {buttonContent}
        </motion.button>
      </div>
    </div>
  );
}, (prevProps: FollowUpInputProps, nextProps: FollowUpInputProps) => {
  // Optimized comparison function
  return (
    prevProps.followUpQuestion === nextProps.followUpQuestion &&
    prevProps.isAskingFollowUp === nextProps.isAskingFollowUp &&
    prevProps.currentTheme === nextProps.currentTheme
  );
});

// Add display name for debugging
FollowUpInput.displayName = 'FollowUpInput'; 