import React, { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { MotionStyle } from "framer-motion"
import MarkdownText from "~components/content/MarkdownText"
import { LoadingThinkingText } from "../loading/LoadingThinkingText"
import { textVariants } from "~contents/variants"
import type { FontSizes } from "../../styles"
import { SharingMenu } from "../common/SharingMenu"

// Define the props interface
interface FollowUpQAItemProps {
  qa: {
    question: string;
    answer: string;
    id: number;
    isComplete: boolean;
  };
  themedStyles: any;
  textDirection: 'ltr' | 'rtl';
  currentTheme: 'light' | 'dark' | 'system';
  targetLanguage: string;
  settings: any;
  fontSizes: FontSizes;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleSpeak: (text: string, id: string) => void;
  speakingId: string | null;
  handleRegenerateFollowUp: (question: string, id: number) => void;
  activeAnswerId: number | null;
  isAskingFollowUp: boolean;
  popupRef: React.RefObject<HTMLDivElement>;
  currentModel: string | null;
  // Export props
  handleExportAsDoc: (text: string, id: string, filename?: string) => Promise<void>;
  handleExportAsMd: (text: string, id: string, filename?: string) => Promise<void>;
  handleRichCopy: (text: string, id: string) => Promise<void>;
  exportingDocId: string | null;
  exportingMdId: string | null;
  richCopiedId: string | null;
}

// Style objects
const questionBubbleStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-end' as const,
  width: '100%'
};

const answerBubbleStyle: MotionStyle = {
  display: 'flex',
  flexDirection: 'row' as const,
  justifyContent: 'flex-start' as const,
  width: '100%',
  lineHeight: '13px'
};

// Motion variants for Q&A bubbles
const questionBubbleVariants = {
  initial: { x: 60, opacity: 0, scale: 0.95 },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 250, damping: 20 }
  },
  exit: { x: 60, opacity: 0, scale: 0.95 }
};

const answerBubbleVariants = {
  initial: { x: -60, opacity: 0, scale: 0.95 },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 250, damping: 22, delay: 0.15 }
  },
  exit: { x: -60, opacity: 0, scale: 0.95 }
};

export const FollowUpQAItem = React.memo(({ qa, themedStyles, textDirection, currentTheme, targetLanguage, settings, fontSizes, handleCopy, copiedId, handleSpeak, speakingId, handleRegenerateFollowUp, activeAnswerId, isAskingFollowUp, popupRef, currentModel, handleExportAsDoc, handleExportAsMd, handleRichCopy, exportingDocId, exportingMdId, richCopiedId }: FollowUpQAItemProps) => {
  const { question, answer, id, isComplete } = qa;
  const answerRef = useRef<HTMLDivElement>(null);
  const [animationCycleComplete, setAnimationCycleComplete] = useState(false);
  
  // Reset animation cycle when this item becomes active
  useEffect(() => {
    if (activeAnswerId === id && !isComplete && answer === '') {
      setAnimationCycleComplete(false);
    }
  }, [activeAnswerId, id, isComplete, answer]);

  // Unified scroll effect – triggers once answer is complete
  useEffect(() => {
    if (!isComplete || !answerRef.current || !popupRef.current) return;

    const scrollContainer = popupRef.current.querySelector('.lu-scroll-container') as HTMLElement | null;
    if (!scrollContainer) return;

    const topPadding = 16; // px to leave above the answer

    const scrollIfNeeded = () => {
      if (!answerRef.current) return;

      const containerRect = scrollContainer.getBoundingClientRect();
      const answerRect   = answerRef.current.getBoundingClientRect();

      // If the answer's top is above visible area OR below 40 % of viewport -> scroll
      const upperComfort = containerRect.top + containerRect.height * 0.4;
      const needsScroll  = answerRect.top < containerRect.top + topPadding || answerRect.top > upperComfort;

      if (needsScroll) {
        const offsetWithinContainer = answerRect.top - containerRect.top; // px between top edges
        const targetScrollTop      = scrollContainer.scrollTop + offsetWithinContainer - topPadding;

        scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    };

    // Initial attempt after paint
    requestAnimationFrame(scrollIfNeeded);

    // Watch for further growth for ~3 s
    const ro = new ResizeObserver(scrollIfNeeded);
    ro.observe(answerRef.current);

    const timeout = setTimeout(() => ro.disconnect(), 3000);

    return () => {
      ro.disconnect();
      clearTimeout(timeout);
    };
  }, [isComplete]);

  return (
    <motion.div
      key={id}
      layout="position"
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 15
        }
      }}
      exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
      style={themedStyles.followUpQA}
    >
      {/* Question bubble */}
      <motion.div
        variants={questionBubbleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={questionBubbleStyle}
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
        ref={answerRef}
        id={`qa-answer-${id}`}
        variants={answerBubbleVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={answerBubbleStyle}
      >
        <div style={{
          ...themedStyles.followUpAnswer,
          textAlign: textDirection === "rtl" ? "right" : "left"
        }}>
          <AnimatePresence mode="wait">
          {activeAnswerId === id && !isComplete && (answer === '' || !animationCycleComplete) ? (

              <LoadingThinkingText 
                key="loading"
                currentTheme={currentTheme}
                fontSizes={fontSizes}
                onCycleComplete={() => setAnimationCycleComplete(true)}
              />
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0, filter: 'blur(4px)', y: 5, scale: 0.98 }}
                animate={{ 
                  opacity: 1, 
                  filter: 'blur(0px)', 
                  y: 0, 
                  scale: 1,
                  transition: {
                    delay: 0.1, // Small delay to ensure loading exits first
                    duration: 0.5,
                    ease: 'easeInOut',
                    filter: { duration: 0.3, delay: 0.15 },
                    scale: { duration: 0.4, delay: 0.1 }
                  }
                }}
                exit={{ opacity: 0, filter: 'blur(4px)', y: -5, scale: 0.98 }}
                transition={{ 
                  duration: 0.4, 
                  ease: 'easeInOut',
                  filter: { duration: 0.3 }
                }}
                style={{
                  minHeight: '24px' // Prevent layout shift
                }}
              >
                <MarkdownText
                  text={answer}
                  isStreaming={activeAnswerId === id && !isComplete}
                  language={targetLanguage}
                  theme={currentTheme === "system" ? "light" : currentTheme}
                  fontSize={settings?.customization?.fontSize}
                  fontSizes={fontSizes}
                />
              </motion.div>
            )}
          </AnimatePresence>
          
          {isComplete && (
            <motion.div 
              style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: {
                  delay: 0.3,
                  duration: 0.2
                }
              }}
            >
              {/* Copy text button */}
              <motion.button
                onClick={() => handleCopy(answer, `followup-${id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: copiedId === `followup-${id}` ? '#14742F' : '#666'
                }}
                whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={copiedId === `followup-${id}` ? "Copied!" : "Copy text"}
              >
                {copiedId === `followup-${id}` ? (
                  <motion.svg 
                    width="15" 
                    height="15" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
                  </motion.svg>
                ) : (
                  <motion.svg 
                    width="15" 
                    height="15" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </motion.svg>
                )}
              </motion.button>


              {/* Sharing menu for exports */}
              <SharingMenu
                onExportTxt={() => handleExportAsDoc(answer, `followup-doc-${id}`, `lightup-followup-${id}.txt`)}
                onExportMd={() => handleExportAsMd(answer, `followup-md-${id}`, `lightup-followup-${id}.md`)}
                onCopyFormatted={() => handleRichCopy(answer, `followup-rich-copy-${id}`)}
                onPrint={() => {
                  // Create printable version with proper formatting
                  const formatTextForPrint = (text: string) => {
                    return text
                      // Convert markdown bold to HTML bold
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      // Convert markdown italic to HTML italic
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      // Convert bullet points to HTML list items
                      .replace(/^\s*[\*\-\+]\s+(.+)$/gm, '<li>$1</li>')
                      // Wrap consecutive list items in ul tags
                      .replace(/(<li>.*<\/li>)/gs, (match) => {
                        const items = match.match(/<li>.*?<\/li>/g);
                        return items ? `<ul>${items.join('')}</ul>` : match;
                      })
                      // Convert line breaks to paragraphs
                      .split('\n\n')
                      .map(paragraph => paragraph.trim())
                      .filter(paragraph => paragraph.length > 0)
                      .map(paragraph => {
                        // Don't wrap if it's already a list
                        if (paragraph.includes('<ul>') || paragraph.includes('<li>')) {
                          return paragraph;
                        }
                        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
                      })
                      .join('');
                  };

                  const formattedContent = formatTextForPrint(answer);
                  
                  const printWindow = window.open('', '_blank');
                  printWindow?.document.write(`
                    <html>
                      <head>
                        <title>LightUp Follow-up Response</title>
                        <style>
                          body { 
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                            line-height: 1.6; 
                            margin: 40px; 
                            color: #333;
                            max-width: 800px;
                          }
                          h1, h2, h3 { color: #2c3345; margin-top: 24px; margin-bottom: 16px; }
                          p { margin-bottom: 16px; }
                          ul { padding-left: 24px; margin-bottom: 16px; }
                          li { margin-bottom: 8px; }
                          strong { font-weight: 600; }
                          .header { 
                            border-bottom: 2px solid #e5e7eb; 
                            padding-bottom: 16px; 
                            margin-bottom: 32px; 
                          }
                          .question { 
                            background: #f8f9fa; 
                            padding: 16px; 
                            border-radius: 8px; 
                            margin-bottom: 24px; 
                            font-weight: 500;
                            border-left: 4px solid #6366f1;
                          }
                          .footer { 
                            margin-top: 40px; 
                            padding-top: 20px; 
                            border-top: 1px solid #ccc; 
                            font-size: 12px; 
                            color: #666; 
                            text-align: center;
                          }
                          @media print {
                            body { margin: 20px; }
                            .header { page-break-after: avoid; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>LightUp Follow-up Response</h1>
                          <p style="color: #666; font-size: 14px; margin: 0;">${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                        </div>
                        <div class="question">
                          <strong>Question:</strong> ${question}
                        </div>
                        <div class="content">
                          ${formattedContent}
                        </div>
                        <div class="footer">Generated by LightUp • boimaginations.com/lightup</div>
                      </body>
                    </html>
                  `);
                  printWindow?.document.close();
                  printWindow?.print();
                }}
                currentTheme={currentTheme}
                exportingDocId={exportingDocId}
                exportingMdId={exportingMdId}
                richCopiedId={richCopiedId}
                txtExportId={`followup-doc-${id}`}
                mdExportId={`followup-md-${id}`}
                richCopyId={`followup-rich-copy-${id}`}
              />

              {/* Speak button */}
              <motion.button
                onClick={() => handleSpeak(answer, `followup-${id}`)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: speakingId === `followup-${id}` ? '#14742F' : '#666'
                }}
                whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={speakingId === `followup-${id}` ? "Stop speaking" : "Read text aloud"}
              >
                {speakingId === `followup-${id}` ? (
                  <motion.svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M6 6h4v12H6V6zm8 0h4v12h-4V6z" fill="currentColor"/>
                  </motion.svg>
                ) : (
                  <motion.svg 
                    width="18" 
                    height="18" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor"/>
                  </motion.svg>
                )}
              </motion.button>

              {/* Add regenerate button for follow-up */}
              <motion.button
                onClick={() => handleRegenerateFollowUp(question, id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  color: (activeAnswerId === id && !isComplete) ? '#14742F' : '#666'
                }}
                whileHover={{ scale: 0.9, backgroundColor: currentTheme === "dark" ? "#FFFFFF10" : "#2c2c2c10" }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                title={(activeAnswerId === id && !isComplete) ? "Regenerating..." : "Regenerate response"}
                disabled={activeAnswerId === id && !isComplete}
              >
                <motion.svg 
                  width="14" 
                  height="15" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3"/>
                </motion.svg>
              </motion.button>

              {/* Add model display */}
              <motion.div
                style={{
                  fontSize: fontSizes.model,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginLeft: '4px',
                  minWidth: '80px',
                  justifyContent: 'center'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <span style={{ 
                  textTransform: 'capitalize',
                  fontWeight: 500,
                  color: currentTheme === 'dark' ? 'rgb(132, 132, 132)' : 'rgb(102, 102, 102)',
                  userSelect: 'none',
                  backgroundColor: currentTheme === 'dark' ? '#494949' : '#f0f0f0',
                  padding: '2px 10px',
                  borderRadius: '11px',
                }}
                title={currentModel ? `AI Model: ${currentModel}` : 'Loading AI model...'}
                >
                  {currentModel || 'Loading...'}
                </span>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
});

FollowUpQAItem.displayName = 'FollowUpQAItem';
