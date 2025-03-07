import { useState, useCallback, useRef } from 'react';
import type { Settings } from '../types/settings';

export interface FollowUpQA {
  question: string;
  answer: string;
  id: number;
  isComplete: boolean;
}

interface UseFollowUpReturn {
  followUpQAs: FollowUpQA[];
  followUpQuestion: string;
  isAskingFollowUp: boolean;
  activeAnswerId: number | null;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFollowUpQAs: React.Dispatch<React.SetStateAction<FollowUpQA[]>>;
  setFollowUpQuestion: React.Dispatch<React.SetStateAction<string>>;
  setActiveAnswerId: React.Dispatch<React.SetStateAction<number | null>>;
  setIsAskingFollowUp: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useFollowUp = (): UseFollowUpReturn => {
  const [followUpQAs, setFollowUpQAs] = useState<FollowUpQA[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [activeAnswerId, setActiveAnswerId] = useState<number | null>(null);
  
  // Use direct DOM value for typing to prevent React re-renders
  const inputValueRef = useRef("");
  
  const handleFollowUpQuestion = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Store the current value in the ref for immediate access
    inputValueRef.current = e.target.value;
    
    // Update the state (triggers render)
    setFollowUpQuestion(e.target.value);
  }, []);

  return {
    followUpQAs,
    followUpQuestion,
    isAskingFollowUp,
    activeAnswerId,
    handleFollowUpQuestion,
    setFollowUpQAs,
    setFollowUpQuestion,
    setActiveAnswerId,
    setIsAskingFollowUp
  };
}; 