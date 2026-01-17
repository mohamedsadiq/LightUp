import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { FollowUpInput } from "./FollowUpInput"

interface SearchFollowUpInputProps {
  isSearchVisible: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement>;
  followUpQuestion: string;
  themedStyles: any;
  normalizedTheme: "light" | "dark";
  fontSizes: any;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleAskFollowUpWrapper: (question?: string) => void;
  isAskingFollowUp: boolean;
  setIsInputFocused: (focused: boolean) => void;
}

export const SearchFollowUpInput = ({
  isSearchVisible,
  inputRef,
  followUpQuestion,
  themedStyles,
  normalizedTheme,
  fontSizes,
  handleFollowUpQuestion,
  handleAskFollowUpWrapper,
  isAskingFollowUp,
  setIsInputFocused
}: SearchFollowUpInputProps) => {
  return (
    <AnimatePresence>
      {isSearchVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 15,
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
  );
};

SearchFollowUpInput.displayName = 'SearchFollowUpInput';
