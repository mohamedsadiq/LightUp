import { useState } from 'react';
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

  const handleFollowUpQuestion = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFollowUpQuestion(e.target.value);
  };

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