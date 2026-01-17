import React from "react"
import { FollowUpQAItem } from "./FollowUpQAItem"

interface QASearchSectionProps {
  followUpQAs: any[];
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
  // Export props
  handleExportAsDoc: (text: string, id: string, filename?: string) => Promise<void>;
  handleExportAsMd: (text: string, id: string, filename?: string) => Promise<void>;
  handleRichCopy: (text: string, id: string) => Promise<void>;
  exportingDocId: string | null;
  exportingMdId: string | null;
  richCopiedId: string | null;
}

export const QASearchSection = ({
  followUpQAs,
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
  handleExportAsDoc,
  handleExportAsMd,
  handleRichCopy,
  exportingDocId,
  exportingMdId,
  richCopiedId
}: QASearchSectionProps) => {
  return (
    <>
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
    </>
  );
};

QASearchSection.displayName = 'QASearchSection';
