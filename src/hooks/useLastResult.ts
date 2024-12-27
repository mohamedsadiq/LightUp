import { useState, useEffect } from 'react';

interface LastResult {
  text: string;
  explanation: string;
  isComplete: boolean;
}

interface UseLastResultReturn {
  lastResult: LastResult;
  updateLastResult: (text: string, explanation: string, isComplete: boolean) => void;
}

export const useLastResult = (): UseLastResultReturn => {
  const [lastResult, setLastResult] = useState<LastResult>({
    text: "",
    explanation: "",
    isComplete: false
  });

  const updateLastResult = (text: string, explanation: string, isComplete: boolean) => {
    setLastResult({
      text,
      explanation,
      isComplete
    });
  };

  return {
    lastResult,
    updateLastResult
  };
}; 