import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWordByWordStreamingProps {
  streamingText: string;
  isLoading: boolean;
  wordsPerSecond?: number;
  enableWordByWord?: boolean;
  onAnimationComplete?: () => void;
}

interface UseWordByWordStreamingReturn {
  displayedText: string;
  isAnimating: boolean;
  wordsDisplayed: number;
  totalWords: number;
  progress: number; // 0-1 representing animation progress
  resetAnimation: () => void;
}

export const useWordByWordStreaming = ({
  streamingText,
  isLoading,
  wordsPerSecond = 8,
  enableWordByWord = true,
  onAnimationComplete
}: UseWordByWordStreamingProps): UseWordByWordStreamingReturn => {
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [wordsDisplayed, setWordsDisplayed] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const wordIndexRef = useRef(0);
  const previousTextRef = useRef('');
  const animationCompleteRef = useRef(false);

  // --- Word queue management ---
  const wordQueueRef = useRef<string[]>([]);

  // Helper to enqueue new text diff
  const startInterval = useCallback(() => {
    if (intervalRef.current || wordQueueRef.current.length === 0) return;

    const delayBetweenWords = 1000 / wordsPerSecond;

    setIsAnimating(true);

    intervalRef.current = setInterval(() => {
      const nextWord = wordQueueRef.current.shift();
      if (nextWord === undefined) {
        // Queue empty – stop interval
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setIsAnimating(false);
        if (!isLoading) {
          onAnimationComplete?.();
        }
        return;
      }

      setDisplayedText(prev => prev + nextWord);
      if (nextWord.trim().length > 0) {
        setWordsDisplayed(prev => prev + 1);
      }
    }, delayBetweenWords);
  }, [wordsPerSecond, isLoading, onAnimationComplete]);

  const enqueueNewWords = useCallback((newSlice: string) => {
    const tokens = newSlice.match(/(\S+\s*)/g) || [];
    if (tokens.length) {
      wordQueueRef.current.push(...tokens);
      startInterval();
    }
  }, [startInterval]);

  // Update queue whenever streamingText grows
  useEffect(() => {
    const prev = previousTextRef.current;
    if (streamingText.length > prev.length) {
      const diff = streamingText.slice(prev.length);
      enqueueNewWords(diff);
      previousTextRef.current = streamingText;
    }
  }, [streamingText, enqueueNewWords]);

  const totalWords = useRef(0);
  useEffect(() => {
    totalWords.current = streamingText.split(/\s+/).filter(w=>w.length).length;
  }, [streamingText]);

  const progress = totalWords.current > 0 ? Math.min(wordsDisplayed / totalWords.current, 1) : 0;

  // Reset animation function
  const resetAnimation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText('');
    setIsAnimating(false);
    setWordsDisplayed(0);
    wordIndexRef.current = 0;
    previousTextRef.current = '';
    animationCompleteRef.current = false;
  }, []);

  // Handle text changes and animation
  useEffect(() => {
    // If word-by-word is disabled, show all text immediately
    if (!enableWordByWord) {
      setDisplayedText(streamingText);
      setIsAnimating(false);
      setWordsDisplayed(totalWords.current);
      return;
    }
 
    // If no text or empty text, reset
    if (!streamingText || streamingText.trim().length === 0) {
      resetAnimation();
      return;
    }
 
    // No further action needed; enqueueNewWords effect will start typing.
  }, [streamingText, enableWordByWord, resetAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    displayedText,
    isAnimating,
    wordsDisplayed,
    totalWords: totalWords.current,
    progress,
    resetAnimation
  };
}; 