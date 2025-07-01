import React, { useMemo, useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import TextareaAutosize from "react-textarea-autosize"
import { debounce } from "../../utils/debounce"
import type { FontSizes } from "../../styles"

interface FollowUpInputProps {
  inputRef: React.RefObject<HTMLTextAreaElement>;
  followUpQuestion: string;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAskFollowUpWrapper: (question?: string) => void;
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
  const INITIAL_HEIGHT = parseFloat(fontSizes.base.replace('px', '')) * 1.5; // Parse px values and apply line height
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
    fontSize: '16px',
    textAlign: 'left' as const,
  }), [themedStyles.input, isAskingFollowUp, INITIAL_HEIGHT, fontSizes]);

  const containerStyle = useMemo(() => ({
    ...themedStyles.followUpInputContainer,
    marginTop: '8px',
    marginBottom: '16px',
    paddingTop: '8px',
  }), [themedStyles.followUpInputContainer]);

  // We don't need the custom autoResizeTextarea logic anymore, as the library handles this efficiently

  // Local state for the textarea value to make it uncontrolled
  const [localInputValue, setLocalInputValue] = useState("");
  
  // Initialize local state with the prop value
  useEffect(() => {
    setLocalInputValue(followUpQuestion);
  }, []);
  
  // Debounced function to update parent state
  const debouncedUpdateParent = useMemo(
    () => debounce((value: string) => {
      // Create a synthetic event object to maintain API compatibility
      const syntheticEvent = {
        target: { value },
        preventDefault: () => {},
        stopPropagation: () => {}
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      handleFollowUpQuestion(syntheticEvent);
    }, 200), // Longer debounce for parent updates
    [handleFollowUpQuestion]
  );
  
  // Optimized change handler that updates local state immediately
  // but only updates parent state after debounce
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalInputValue(value); // Update local state immediately for responsive UI
    debouncedUpdateParent(value); // Debounced update to parent state
    // The TextareaAutosize component handles resizing automatically
  }, [debouncedUpdateParent]);

  // Optimized key handler using local state
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter' && !e.shiftKey && !isAskingFollowUp) {
      e.preventDefault();
      if (localInputValue.trim()) {
        // Immediately sync local state to parent before submitting
        // to ensure the parent has the complete current value
        const syntheticEvent = {
          target: { value: localInputValue },
          preventDefault: () => {},
          stopPropagation: () => {}
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        handleFollowUpQuestion(syntheticEvent);
        
        // Small delay to ensure state update, then submit
        setTimeout(() => {
          handleAskFollowUpWrapper(localInputValue);
        }, 10);
      }
    }
  }, [localInputValue, handleFollowUpQuestion, handleAskFollowUpWrapper, isAskingFollowUp]);

  // Optimized focus handlers
  const handleFocus = useCallback(() => setIsInputFocused(true), [setIsInputFocused]);
  const handleBlur = useCallback(() => setIsInputFocused(false), [setIsInputFocused]);

  // No need for manual resize on mount as TextareaAutosize handles this
  
  // Sync from parent to local state when followUpQuestion changes externally
  // (e.g., when cleared after submission)
  useEffect(() => {
    // Only update local state if it's significantly different
    // to avoid disrupting user typing
    if (followUpQuestion === "" && localInputValue !== "") {
      setLocalInputValue("");
    }
  }, [followUpQuestion]);

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
        <TextareaAutosize
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={localInputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          style={textareaStyle}
          disabled={isAskingFollowUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
          minRows={1}
          maxRows={2} // Equivalent to MAX_HEIGHT with our line height
          cacheMeasurements={true} // Optimize performance
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          inputMode="text"
          className="lu-optimized-textarea lu-centered-placeholder"
        />
        <motion.button
          onClick={() => handleAskFollowUpWrapper(localInputValue)}
          disabled={!localInputValue.trim() || isAskingFollowUp}
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          animate={isAskingFollowUp ? { scale: 0.9, opacity: 0.7 } : { scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          style={themedStyles.searchSendButton}
          className="lu-search-send-button"
          title={!localInputValue.trim() ? "Type a question first" : isAskingFollowUp ? "Sending..." : "Send message"}
        >
          {buttonContent}
        </motion.button>
      </div>
    </div>
  );
}, (prevProps: FollowUpInputProps, nextProps: FollowUpInputProps) => {
  // Enhanced comparison function for uncontrolled component
  // We can skip re-renders when followUpQuestion changes during typing
  // since we're now managing that locally with useState
  return (
    // We only care about major state changes from parent, not every keystroke
    // Only re-render when followUpQuestion is cleared (becomes empty)
    ((prevProps.followUpQuestion === "" && nextProps.followUpQuestion === "") ||
     (prevProps.followUpQuestion !== "" && nextProps.followUpQuestion !== "")) &&
    prevProps.isAskingFollowUp === nextProps.isAskingFollowUp &&
    prevProps.currentTheme === nextProps.currentTheme
  );
});

// Add display name for debugging
FollowUpInput.displayName = "OptimizedFollowUpInput";