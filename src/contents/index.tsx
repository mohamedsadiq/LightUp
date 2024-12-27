import { useState, useMemo, useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { motion, AnimatePresence } from "framer-motion"
import MarkdownText from "../components/content/MarkdownText"
import { Logo, CloseIcon } from "../components/icons"
import "../style.css"
import { styles } from "./styles"
import { textVariants, iconButtonVariants } from "./variants"
import { useResizable } from '../hooks/useResizable'
import { PopupModeSelector } from "../components/content/PopupModeSelector"
import { v4 as uuidv4 } from 'uuid'
import { getStyles } from "./styles"
import { getTextDirection } from "~utils/rtl"
import { truncateText } from "~utils/textProcessing"
import { flexMotionStyle, popupMotionVariants, toastMotionVariants } from "~styles/motionStyles"
import type { Theme } from "~types/theme"
import { applyHighlightColor } from "~utils/highlight"
import { calculatePosition } from "~utils/position"
import { Storage } from "@plasmohq/storage"
import { Z_INDEX } from "~utils/constants"

// Import our hooks
import { useSpeech } from "~hooks/useSpeech"
import { useToast } from "~hooks/useToast"
import { useEnabled } from "~hooks/useEnabled"
import { useFollowUp } from "~hooks/useFollowUp"
import { useSettings } from "~hooks/useSettings"
import { useKeyboardShortcuts } from "~hooks/useKeyboardShortcuts"
import { usePort } from "~hooks/usePort"
import { usePopup } from "~hooks/usePopup"
import { useCopy } from "~hooks/useCopy"
import { useLastResult } from "~hooks/useLastResult"

// Add font import
const fontImportStyle = document.createElement('style');
fontImportStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=K2D:wght@400;500;600;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
`;
document.head.appendChild(fontImportStyle);

// Plasmo config
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

function Content() {
  // Generate a stable connection ID
  const [connectionId] = useState(() => uuidv4());

  // Initialize all our hooks
  const { width, height, handleResizeStart } = useResizable({
    initialWidth: 340,
    initialHeight: 400
  });

  const { settings, setSettings, isConfigured, currentTheme, targetLanguage, fontSize } = useSettings();
  const { toast, showToast } = useToast();
  const { isEnabled, handleEnabledChange } = useEnabled(showToast);
  const { voicesLoaded, speakingId, handleSpeak } = useSpeech();
  const { copiedId, handleCopy } = useCopy();
  const { lastResult, updateLastResult } = useLastResult();

  // Initialize followUpQAs state first
  const {
    followUpQAs,
    followUpQuestion,
    isAskingFollowUp,
    activeAnswerId,
    handleFollowUpQuestion,
    setFollowUpQAs,
    setFollowUpQuestion,
    setActiveAnswerId,
    setIsAskingFollowUp
  } = useFollowUp();

  const {
    port,
    streamingText,
    isLoading,
    error,
    setStreamingText,
    setIsLoading,
    setError
  } = usePort(
    connectionId,
    (id, content) => {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, answer: qa.answer + content } : qa
      ));
    },
    (id) => {
      setFollowUpQAs(prev => prev.map(qa =>
        qa.id === id ? { ...qa, isComplete: true } : qa
      ));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
    }
  );

  const {
    isVisible,
    position,
    selectedText,
    isBlurActive,
    isInteractingWithPopup,
    isInputFocused,
    mode,
    handleClose,
    handleModeChange,
    setIsVisible,
    setPosition,
    setIsInteractingWithPopup,
    setIsInputFocused,
    setSelectedText
  } = usePopup(
    port, 
    connectionId, 
    settings?.customization?.radicallyFocus,
    isEnabled,
    settings,
    setIsLoading,
    setError,
    setStreamingText,
    setFollowUpQAs
  );

  // Setup keyboard shortcuts
  useKeyboardShortcuts({
    isEnabled,
    handleEnabledChange,
    handleModeChange,
    settings,
    setSettings,
    showToast
  });

  // Wrap handleAskFollowUp to include necessary context
  const handleAskFollowUpWrapper = () => {
    if (!port || !followUpQuestion.trim() || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    const newId = Date.now();
    
    setActiveAnswerId(newId);
    
    setFollowUpQAs(prev => [
      ...prev,
      { 
        question: followUpQuestion, 
        answer: '', 
        id: newId,
        isComplete: false 
      }
    ]);

    try {
      port.postMessage({
        type: "PROCESS_TEXT",
        payload: {
          text: followUpQuestion,
          context: selectedText,
          mode: mode,
          settings: settings,
          isFollowUp: true,
          id: newId,
          connectionId
        }
      });

      // Clear the input after sending
      setFollowUpQuestion("");
    } catch (error) {
      setFollowUpQAs(prev => prev.filter(qa => qa.id !== newId));
      setActiveAnswerId(null);
      setIsAskingFollowUp(false);
      setError('Failed to process follow-up question');
    }
  };

  // Get themed styles
  const textDirection = getTextDirection(targetLanguage);
  const themedStyles = getStyles(currentTheme, textDirection, fontSize);

  // Update last result when streaming completes
  useMemo(() => {
    if (streamingText && !isLoading) {
      updateLastResult(selectedText, streamingText, true);
    }
  }, [streamingText, isLoading, selectedText]);

  // Update the highlight color effect
  useEffect(() => {
    // Apply highlight color when settings or enabled state changes
    const cleanup = applyHighlightColor(settings?.customization?.highlightColor, isEnabled);

    // Watch for settings changes
    const storage = new Storage();
    const handleSettingsChange = async () => {
      const newSettings = await storage.get("settings") as typeof settings;
      if (newSettings?.customization?.highlightColor !== settings?.customization?.highlightColor) {
        cleanup();
        applyHighlightColor(newSettings?.customization?.highlightColor, isEnabled);
      }
    };

    storage.watch({
      settings: handleSettingsChange
    });

    return () => {
      cleanup();
      storage.unwatch({
        settings: handleSettingsChange
      });
    };
  }, [isEnabled, settings?.customization?.highlightColor]);

  // Add this effect after the other useEffects
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const popup = document.querySelector('[data-plasmo-popup]');
      if (popup && !popup.contains(event.target as Node) && !isInteractingWithPopup) {
        setIsVisible(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isInteractingWithPopup, setIsVisible]);

  return (
    <>
      {/* Toast notification */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            variants={toastMotionVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              backgroundColor: currentTheme === "dark" ? '#2C2C2C' : 'white',
              color: currentTheme === "dark" ? 'white' : 'black',
              padding: '8px 16px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              zIndex: Z_INDEX.TOAST,
              fontSize: '14px',
              fontFamily: "'K2D', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isEnabled ? '#10B981' : '#EF4444',
                marginRight: '4px'
              }}
            />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main popup */}
      <AnimatePresence mode="sync">
        {isVisible && (
          <motion.div 
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              zIndex: Z_INDEX.POPUP
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              ...themedStyles.popupPositioner,
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}>
              <motion.div 
                style={{
                  ...themedStyles.popup,
                  width: `${width}px`,
                  height: `${height}px`,
                  overflow: 'auto',
                  position: 'relative'
                }}
                data-plasmo-popup
                className="no-select"
                onClick={(e) => e.stopPropagation()}
                onMouseEnter={() => setIsInteractingWithPopup(true)}
                onMouseLeave={() => !isInputFocused && setIsInteractingWithPopup(false)}
                initial="initial"
                animate="animate"
                exit="exit"
                layout
                variants={popupMotionVariants}
              >
                {/* Header */}
                <div style={themedStyles.buttonContainerParent}>
                  <motion.div style={{ marginLeft: '-6px' }} layout>
                    {Logo(currentTheme)}
                  </motion.div>
                  <PopupModeSelector 
                    activeMode={mode}
                    onModeChange={handleModeChange}
                    isLoading={isLoading}
                    theme={currentTheme}
                  />
                  <div style={themedStyles.buttonContainer}>
                    <motion.button 
                      onClick={handleClose}
                      style={{
                        ...themedStyles.button,
                        marginTop: '2px'
                      }}
                      variants={iconButtonVariants}
                      whileHover="hover"
                    >
                      <CloseIcon theme={currentTheme} />
                    </motion.button>
                  </div>
                </div>

                {/* Selected Text */}
                {settings?.customization?.showSelectedText !== false && (
                  <p style={{...themedStyles.text, fontWeight: '500', fontStyle: 'italic', textDecoration: 'underline'}}>
                    {truncateText(selectedText)}
                  </p>
                )}

                {/* Main Content */}
                <AnimatePresence mode="wait">
                  {isLoading && !streamingText ? (
                    <motion.div style={flexMotionStyle} layout>
                      {[...Array(10)].map((_, i) => (
                        <motion.div
                          key={i}
                          style={{
                            height: '16px',
                            background: currentTheme === "dark" 
                              ? 'linear-gradient(90deg, #2C2C2C 25%, #3D3D3D 50%, #2C2C2C 75%)'
                              : 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                            borderRadius: '4px',
                            width: i === 2 ? '70%' : '100%',
                          }}
                          animate={{
                            backgroundPosition: ['0px', '500px'],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                      ))}
                    </motion.div>
                  ) : error ? (
                    <motion.p
                      style={themedStyles.error}
                      variants={textVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {error}
                    </motion.p>
                  ) : (
                    <motion.div
                      variants={textVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {/* Explanation */}
                      <motion.div
                        style={{
                          ...themedStyles.explanation,
                          textAlign: textDirection === "rtl" ? "right" : "left"
                        }}
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                      >
                        <div style={{ marginBottom: '8px' }}>
                          <MarkdownText 
                            text={streamingText} 
                            isStreaming={isLoading}
                            language={targetLanguage}
                          />
                        </div>

                        {/* Action buttons */}
                        {!isLoading && streamingText && (
                          <motion.div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* Copy button */}
                            <motion.button
                              onClick={() => handleCopy(streamingText, 'initial')}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                color: '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {copiedId === 'initial' ? (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg width="12" height="12" viewBox="0 0 62 61" fill="none">
                                  <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                                </svg>
                              )}
                            </motion.button>

                            {/* Speak button */}
                            <motion.button
                              onClick={() => handleSpeak(streamingText, 'main')}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '4px',
                                color: speakingId === 'main' ? '#14742F' : '#666'
                              }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title={speakingId === 'main' ? "Stop speaking" : "Read text aloud"}
                            >
                              {speakingId === 'main' ? (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                  <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                                </svg>
                              ) : (
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                                </svg>
                              )}
                            </motion.button>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Follow-up QAs */}
                      {followUpQAs.map(({ question, answer, id, isComplete }) => (
                        <motion.div
                          key={id}
                          initial={{ opacity: 0, y: 50 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={themedStyles.followUpQA}
                        >
                          {/* Question bubble */}
                          <motion.div
                            style={{
                              display: 'flex' as const,
                              justifyContent: 'flex-end' as const,
                              width: '100%'
                            }}
                          >
                            <div style={{
                              ...themedStyles.followUpQuestion,
                              textAlign: textDirection === "rtl" ? "right" : "left"
                            }}>
                              {question}
                            </div>
                          </motion.div>

                          {/* Answer bubble */}
                          <motion.div
                            style={{
                              display: 'flex' as const,
                              justifyContent: 'flex-start' as const,
                              width: '100%'
                            }}
                          >
                            <div style={{
                              ...themedStyles.followUpAnswer,
                              textAlign: textDirection === "rtl" ? "right" : "left"
                            }}>
                              <MarkdownText
                                text={answer}
                                isStreaming={activeAnswerId === id && !isComplete}
                                language={targetLanguage}
                              />
                              
                              {isComplete && (
                                <motion.div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <motion.button
                                    onClick={() => handleCopy(answer, `followup-${id}`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      color: copiedId === `followup-${id}` ? '#666' : '#666'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    {copiedId === `followup-${id}` ? (
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                                      </svg>
                                    ) : (
                                      <svg width="12" height="12" viewBox="0 0 62 61" fill="none">
                                        <path d="M12.6107 48.8146V57.9328C12.6107 59.8202 14.1912 60.9722 15.6501 60.9722H58.2018C59.6546 60.9722 61.2412 59.8202 61.2412 57.9328V15.3811C61.2412 13.9283 60.0893 12.3417 58.2018 12.3417H49.0836V3.22349C49.0836 1.77065 47.9317 0.184082 46.0442 0.184082H3.49253C1.6081 0.184082 0.453125 1.76153 0.453125 3.22349V45.7752C0.453125 47.6626 2.03362 48.8146 3.49253 48.8146H12.6107ZM44.5245 12.3417H15.6501C13.7657 12.3417 12.6107 13.9192 12.6107 15.3811V44.2554H5.01223V4.74319H44.5245V12.3417Z" fill="currentColor"/>
                                      </svg>
                                    )}
                                  </motion.button>

                                  <motion.button
                                    onClick={() => handleSpeak(answer, `followup-${id}`)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      cursor: 'pointer',
                                      padding: '4px',
                                      borderRadius: '4px',
                                      color: speakingId === `followup-${id}` ? '#14742F' : '#666'
                                    }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    title={speakingId === `followup-${id}` ? "Stop speaking" : "Read text aloud"}
                                  >
                                    {speakingId === `followup-${id}` ? (
                                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                        <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                                      </svg>
                                    ) : (
                                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                                      </svg>
                                    )}
                                  </motion.button>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        </motion.div>
                      ))}

                      {/* Input section */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={themedStyles.followUpInputContainer}
                      >
                        <div style={themedStyles.searchContainer}>
                          <input
                            type="text"
                            value={followUpQuestion}
                            onChange={handleFollowUpQuestion}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === 'Enter') {
                                handleAskFollowUpWrapper();
                              }
                            }}
                            placeholder="Ask a follow-up question..."
                            style={themedStyles.input}
                            disabled={isAskingFollowUp}
                            onFocus={() => setIsInputFocused(true)}
                            onBlur={() => setIsInputFocused(false)}
                          />
                          <motion.button
                            onClick={handleAskFollowUpWrapper}
                            disabled={!followUpQuestion.trim() || isAskingFollowUp}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={themedStyles.searchSendButton}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                              <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Resize handle */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '15px',
                    height: '15px',
                    cursor: 'se-resize',
                    background: 'transparent'
                  }}
                  onMouseDown={handleResizeStart}
                  className="resize-handle"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blur overlay */}
      {isBlurActive && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: currentTheme === 'dark' 
              ? 'rgba(0, 0, 0, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: Z_INDEX.BLUR_OVERLAY,
            transition: 'all 0.3s ease'
          }}
        />
      )}
    </>
  );
}

export default Content;
