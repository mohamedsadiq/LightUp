import React, { useMemo, useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import TextareaAutosize from "react-textarea-autosize"
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

  // Supported LightUp actions (modes)
  const COMMANDS = useMemo(() => [
    {
      label: 'Summarize',
      value: 'summarize',
      color: '#3B82F6', // Blue
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 8h16M8 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      label: 'Explain',
      value: 'explain',
      color: '#10B981', // Green
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      label: 'Analyze',
      value: 'analyze',
      color: '#F59E0B', // Amber
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      label: 'Translate',
      value: 'translate',
      color: '#8B5CF6', // Purple
      icon: (
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
        </svg>
      )
    }
  ], []);

  // Local state for the textarea value to make it uncontrolled
  const [localInputValue, setLocalInputValue] = useState("");
  const [isCommandMenuVisible, setIsCommandMenuVisible] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(COMMANDS);
  const [selectedCommandIdx, setSelectedCommandIdx] = useState(0);
  const [selectedActionColor, setSelectedActionColor] = useState<string | null>(null);
  const [shouldBounce, setShouldBounce] = useState(false);

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
    color: selectedActionColor || (themedStyles.input?.color || (currentTheme === 'dark' ? '#FFFFFF' : '#000000')),
  }), [themedStyles.input, isAskingFollowUp, INITIAL_HEIGHT, fontSizes, selectedActionColor, currentTheme]);

  const containerStyle = useMemo(() => ({
    ...themedStyles.followUpInputContainer,
    marginTop: '8px',
    marginBottom: '16px',
    paddingTop: '8px',
  }), [themedStyles.followUpInputContainer]);

  // We don't need the custom autoResizeTextarea logic anymore, as the library handles this efficiently

  // Initialize filtered commands after COMMANDS is defined
  useEffect(() => {
    setFilteredCommands(COMMANDS);
  }, [COMMANDS]);

  // Optimized change handler that updates local state immediately
  // but only updates parent state after debounce
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalInputValue(value); // Update local state immediately for responsive UI
    // Handle slash command menu visibility and filtering
    if (value.startsWith('/')) {
      const query = value.slice(1).toLowerCase();
      const newFiltered = COMMANDS.filter(cmd => cmd.value.startsWith(query));
      setFilteredCommands(newFiltered);
      setIsCommandMenuVisible(newFiltered.length > 0);
      setSelectedCommandIdx(0);

      // Check if we have an exact match for action color
      const exactMatch = COMMANDS.find(cmd => cmd.value === query);
      setSelectedActionColor(exactMatch ? exactMatch.color : null);
    } else {
      setIsCommandMenuVisible(false);
      setSelectedActionColor(null);
    }
    const syntheticEvent = {
      target: { value },
      preventDefault: () => { },
      stopPropagation: () => { }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleFollowUpQuestion(syntheticEvent);
    // The TextareaAutosize component handles resizing automatically
  }, [handleFollowUpQuestion, COMMANDS]);

  // Optimized focus handlers
  const handleFocus = useCallback(() => setIsInputFocused(true), [setIsInputFocused]);
  const handleBlur = useCallback(() => {
    setIsInputFocused(false);
    setIsCommandMenuVisible(false);
    // Reset action color when losing focus unless there's still an action in the input
    if (!localInputValue.match(/^\/\w+\s/)) {
      setSelectedActionColor(null);
    }
  }, [setIsInputFocused, setIsCommandMenuVisible, localInputValue, setSelectedActionColor]);

  // No need for manual resize on mount as TextareaAutosize handles this

  // Local helper to reset both local and parent state after submit
  const clearInput = useCallback(() => {
    setLocalInputValue("");
    setSelectedActionColor(null);
    setIsCommandMenuVisible(false);
    const syntheticClearEvent = {
      target: { value: "" },
      preventDefault: () => { },
      stopPropagation: () => { }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleFollowUpQuestion(syntheticClearEvent);
  }, [handleFollowUpQuestion]);

  // Sync from parent to local state when followUpQuestion changes externally
  // (e.g., when cleared after submission)
  useEffect(() => {
    // Only update local state if it's significantly different
    // to avoid disrupting user typing
    if (followUpQuestion === "" && localInputValue !== "") {
      setLocalInputValue("");
      setSelectedActionColor(null);
    }
  }, [followUpQuestion]);

  // Optimized key handler using local state
  const handleKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation();
    if (isCommandMenuVisible && filteredCommands.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIdx((prev) => (prev + 1) % filteredCommands.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIdx((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const chosen = filteredCommands[selectedCommandIdx];
        if (chosen) {
          // Trigger bounce animation
          setShouldBounce(true);
          setTimeout(() => setShouldBounce(false), 300);

          // Set the action color
          setSelectedActionColor(chosen.color);

          const newValue = `/${chosen.value} `;
          setLocalInputValue(newValue);
          // Immediately update parent as well
          const syntheticEventChoose = {
            target: { value: newValue },
            preventDefault: () => { },
            stopPropagation: () => { }
          } as React.ChangeEvent<HTMLTextAreaElement>;
          handleFollowUpQuestion(syntheticEventChoose);
          // Inform the rest of the extension about mode change so that processing uses the correct action
          try {
            chrome?.runtime?.sendMessage?.({
              type: "MODE_CHANGED",
              mode: chosen.value,
              translationSettings: undefined,
              reprocessExisting: false
            });
          } catch (err) {
            // Fallback: dispatch custom event directly if chrome.runtime is unavailable (e.g. during unit tests)
            const evt = new CustomEvent('modeChanged', { detail: { mode: chosen.value } });
            window.dispatchEvent(evt);
          }
          setIsCommandMenuVisible(false);
        }
        return;
      }
      if (e.key === 'Escape') {
        setIsCommandMenuVisible(false);
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey && !isAskingFollowUp) {
      e.preventDefault();
      if (localInputValue.trim()) {
        // Check if this is an action command and process accordingly
        const actionMatch = localInputValue.match(/^\/(\w+)\s*(.*)/);
        let finalPrompt = localInputValue;

        if (actionMatch) {
          const [, actionName, userPrompt] = actionMatch;
          const action = COMMANDS.find(cmd => cmd.value === actionName);

          if (action && userPrompt.trim()) {
            // Use the action's system prompt format with user's text
            try {
              const { USER_PROMPTS } = await import("~utils/constants");
              if (USER_PROMPTS[actionName] && typeof USER_PROMPTS[actionName] === 'function') {
                finalPrompt = (USER_PROMPTS[actionName] as Function)(userPrompt.trim());
              } else {
                finalPrompt = userPrompt.trim();
              }
            } catch (err) {
              // Fallback to user prompt if import fails
              finalPrompt = userPrompt.trim();
            }
          }
        }

        // Immediately sync local state to parent before submitting
        // to ensure the parent has the complete current value
        const syntheticEvent = {
          target: { value: finalPrompt },
          preventDefault: () => { },
          stopPropagation: () => { }
        } as React.ChangeEvent<HTMLTextAreaElement>;

        handleFollowUpQuestion(syntheticEvent);

        // Small delay to ensure state update, then submit
        setTimeout(() => {
          handleAskFollowUpWrapper(finalPrompt);
          clearInput();
        }, 10);
      }
    }
  }, [localInputValue, handleFollowUpQuestion, handleAskFollowUpWrapper, isAskingFollowUp, isCommandMenuVisible, filteredCommands, selectedCommandIdx, clearInput]);

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
        <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
    );
  }, [isAskingFollowUp]);

  // Before return JSX, create menu component
  const commandMenu = isCommandMenuVisible && filteredCommands.length > 0 && (
    <ul
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 4px)',
        left: 0,
        background: themedStyles.popup?.background || (currentTheme === 'dark' ? '#1e1e1e' : '#ffffff'),
        border: '1px solid',
        borderColor: currentTheme === 'dark' ? '#333' : '#ddd',
        borderRadius: '6px',
        padding: '4px 0',
        listStyle: 'none',
        width: '140px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
        zIndex: 20
      }}
      role="menu"
      aria-label="Slash command options"
    >
      {filteredCommands.map((cmd, idx) => (
        <li
          key={cmd.value}
          role="menuitem"
          tabIndex={0}
          aria-label={cmd.label}
          onClick={() => {
            // Trigger bounce animation
            setShouldBounce(true);
            setTimeout(() => setShouldBounce(false), 300);

            // Set the action color
            setSelectedActionColor(cmd.color);

            const newValue = `/${cmd.value} `;
            setLocalInputValue(newValue);
            const syntheticEventChoose = {
              target: { value: newValue },
              preventDefault: () => { },
              stopPropagation: () => { }
            } as React.ChangeEvent<HTMLTextAreaElement>;
            handleFollowUpQuestion(syntheticEventChoose);
            try {
              chrome?.runtime?.sendMessage?.({
                type: "MODE_CHANGED",
                mode: cmd.value,
                translationSettings: undefined,
                reprocessExisting: false
              });
            } catch (err) {
              const evt = new CustomEvent('modeChanged', { detail: { mode: cmd.value } });
              window.dispatchEvent(evt);
            }
            setIsCommandMenuVisible(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              // Trigger bounce animation
              setShouldBounce(true);
              setTimeout(() => setShouldBounce(false), 300);

              // Set the action color
              setSelectedActionColor(cmd.color);

              const newValue = `/${cmd.value} `;
              setLocalInputValue(newValue);
              const syntheticEventChoose = {
                target: { value: newValue },
                preventDefault: () => { },
                stopPropagation: () => { }
              } as React.ChangeEvent<HTMLTextAreaElement>;
              handleFollowUpQuestion(syntheticEventChoose);
              try {
                chrome?.runtime?.sendMessage?.({
                  type: "MODE_CHANGED",
                  mode: cmd.value,
                  translationSettings: undefined,
                  reprocessExisting: false
                });
              } catch (err) {
                const evt = new CustomEvent('modeChanged', { detail: { mode: cmd.value } });
                window.dispatchEvent(evt);
              }
              setIsCommandMenuVisible(false);
            }
          }}
          style={{
            padding: '8px 12px',
            cursor: 'pointer',
            background: idx === selectedCommandIdx ? (currentTheme === 'dark' ? '#2d2d2d' : '#f0f0f0') : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: idx === selectedCommandIdx ? cmd.color : (currentTheme === 'dark' ? '#FFFFFF' : '#333333'),
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ color: cmd.color, display: 'flex', alignItems: 'center' }}>
            {cmd.icon}
          </span>
          <span>{cmd.label}</span>
        </li>
      ))}
    </ul>
  );

  // Memoized search container style with color and animation
  const searchContainerStyle = useMemo(() => ({
    ...themedStyles.searchContainer,
    position: 'relative' as const,
    borderColor: selectedActionColor || (themedStyles.searchContainer?.borderColor || 'transparent'),
    borderWidth: selectedActionColor ? '2px' : (themedStyles.searchContainer?.borderWidth || '1px'),
    transition: 'all 0.2s ease',
    transform: shouldBounce ? 'scale(1.02)' : 'scale(1)',
    boxShadow: selectedActionColor
      ? `0 0 0 3px ${selectedActionColor}20`
      : (themedStyles.searchContainer?.boxShadow || 'none')
  }), [themedStyles.searchContainer, selectedActionColor, shouldBounce]);

  return (
    <div style={containerStyle}>
      <div
        style={searchContainerStyle}
        className="lu-search-container"
      >
        {commandMenu}
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
          onClick={() => {
            handleAskFollowUpWrapper(localInputValue);
            clearInput();
          }}
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