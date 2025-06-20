import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FollowUpQAItem } from "./FollowUpQAItem"
import { FollowUpInput } from "./FollowUpInput"

interface FollowUpSectionProps {
  followUpQAs: any[];
  isSearchVisible: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  followUpQuestion: string;
  themedStyles: any;
  textDirection: "ltr" | "rtl";
  normalizedTheme: "light" | "dark";
  targetLanguage: string;
  settings: any;
  fontSizes: any;
  handleCopy: (text: string, id: string) => void;
  copiedId: string | null;
  handleCopyAsImage: (target: HTMLElement | string, id: string) => Promise<void>;
  imageCopiedId: string | null;
  isImageCopySupported: boolean;
  handleSpeak: (text: string, id: string) => void;
  speakingId: string | null;
  handleRegenerateFollowUp: (question: string, id: number) => void;
  activeAnswerId: number | null;
  isAskingFollowUp: boolean;
  popupRef: React.RefObject<HTMLDivElement>;
  currentModel: string | null;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAskFollowUpWrapper: () => void;
  setIsInputFocused: (focused: boolean) => void;
  // Export props
  handleExportAsDoc: (text: string, id: string, filename?: string) => Promise<void>;
  handleExportAsMd: (text: string, id: string, filename?: string) => Promise<void>;
  handleRichCopy: (text: string, id: string) => Promise<void>;
  exportingDocId: string | null;
  exportingMdId: string | null;
  richCopiedId: string | null;
}

export const FollowUpSection = ({
  followUpQAs,
  isSearchVisible,
  inputRef,
  followUpQuestion,
  themedStyles,
  textDirection,
  normalizedTheme,
  targetLanguage,
  settings,
  fontSizes,
  handleCopy,
  copiedId,
  handleCopyAsImage,
  imageCopiedId,
  isImageCopySupported,
  handleSpeak,
  speakingId,
  handleRegenerateFollowUp,
  activeAnswerId,
  isAskingFollowUp,
  popupRef,
  currentModel,
  handleFollowUpQuestion,
  handleAskFollowUpWrapper,
  setIsInputFocused,
  handleExportAsDoc,
  handleExportAsMd,
  handleRichCopy,
  exportingDocId,
  exportingMdId,
  richCopiedId
}: FollowUpSectionProps) => {
  return (
    <>
      {/* Follow-up QAs */}
      {followUpQAs.map((qa) => (
        <FollowUpQAItem
          key={qa.id}
          qa={qa}
          themedStyles={themedStyles}
          textDirection={textDirection}
          currentTheme={normalizedTheme}
          targetLanguage={targetLanguage}
          settings={settings}
          fontSizes={fontSizes}
          handleCopy={handleCopy}
          copiedId={copiedId}
          handleCopyAsImage={handleCopyAsImage}
          imageCopiedId={imageCopiedId}
          isImageCopySupported={isImageCopySupported}
          handleSpeak={handleSpeak}
          speakingId={speakingId}
          handleRegenerateFollowUp={handleRegenerateFollowUp}
          activeAnswerId={activeAnswerId}
          isAskingFollowUp={isAskingFollowUp}
          popupRef={popupRef}
          currentModel={currentModel}
          handleExportAsDoc={handleExportAsDoc}
          handleExportAsMd={handleExportAsMd}
          handleRichCopy={handleRichCopy}
          exportingDocId={exportingDocId}
          exportingMdId={exportingMdId}
          richCopiedId={richCopiedId}
        />
      ))}

      {/* Sticky input section pinned to the bottom of the scrollable area */}
      <AnimatePresence>
        {isSearchVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            // Keep the search section visible while the Q&A list scrolls
            style={{
              position: 'sticky',
              bottom: -21,
              zIndex: 15, // ensure it stays above scrolling text
              // Use the popup background so the bar looks seamless
              // background: themedStyles.popup?.background || (normalizedTheme === 'dark' ? '#1e1e1e' : '#ffffff'),
              // Add a subtle backdrop blur for better readability when it overlays content
              // backdropFilter: 'blur(6px)',
              // Small negative margin to visually tighten spacing with the previous element
              marginTop: 'auto',
              paddingTop: '8px',
              paddingBottom: '8px'
            }}
          >
            <FollowUpInput
              inputRef={inputRef}
              followUpQuestion={followUpQuestion}
              handleFollowUpQuestion={handleFollowUpQuestion}
              handleAskFollowUpWrapper={handleAskFollowUpWrapper}
              isAskingFollowUp={isAskingFollowUp}
              setIsInputFocused={setIsInputFocused}
              themedStyles={themedStyles}
              currentTheme={normalizedTheme}
              fontSizes={fontSizes}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

FollowUpSection.displayName = 'FollowUpSection'; 