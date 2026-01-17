import React from "react"
import { QASearchSection } from "./QASearchSection"
import { SearchFollowUpInput } from "./SearchFollowUpInput"

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
  handleSpeak: (text: string, id: string) => void;
  speakingId: string | null;
  handleRegenerateFollowUp: (question: string, id: number) => void;
  activeAnswerId: number | null;
  isAskingFollowUp: boolean;
  popupRef: React.RefObject<HTMLDivElement>;
  currentModel: string | null;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAskFollowUpWrapper: (question?: string) => void;
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
      {/* Q&A Section */}
      <QASearchSection
        followUpQAs={followUpQAs}
        themedStyles={themedStyles}
        textDirection={textDirection}
        normalizedTheme={normalizedTheme}
        targetLanguage={targetLanguage}
        settings={settings}
        fontSizes={fontSizes}
        handleCopy={handleCopy}
        copiedId={copiedId}
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

      {/* Search Input Section */}
      <SearchFollowUpInput
        isSearchVisible={isSearchVisible}
        inputRef={inputRef}
        followUpQuestion={followUpQuestion}
        themedStyles={themedStyles}
        normalizedTheme={normalizedTheme}
        fontSizes={fontSizes}
        handleFollowUpQuestion={handleFollowUpQuestion}
        handleAskFollowUpWrapper={handleAskFollowUpWrapper}
        isAskingFollowUp={isAskingFollowUp}
        setIsInputFocused={setIsInputFocused}
      />
    </>
  );
};

FollowUpSection.displayName = 'FollowUpSection'; 