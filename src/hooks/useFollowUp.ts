import { useState, useCallback, useRef, useEffect } from 'react';
import type { Settings } from '../types/settings';

export interface FollowUpQA {
  question: string;
  answer: string;
  id: number;
  isComplete: boolean;
  historyUpdated?: boolean;
}

interface UseFollowUpReturn {
  followUpQAs: FollowUpQA[];
  followUpQuestion: string;
  isAskingFollowUp: boolean;
  activeAnswerId: number | null;
  handleFollowUpQuestion: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
  
  // Add a debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized input handler that minimizes re-renders
  const handleFollowUpQuestion = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Store the current value in the ref for immediate access
    const value = e.target.value;
    inputValueRef.current = value;
    
    // Use the target's value directly to update the input
    e.target.value = value;
    
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Update the state with debouncing to reduce render cycles
    debounceTimerRef.current = setTimeout(() => {
      setFollowUpQuestion(value);
    }, 10); // Very short debounce time to maintain responsiveness while reducing renders
  }, []);
  
  // Clean up the debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
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