import { useState } from 'react';
import { stripHtml } from '../utils/textProcessing';

interface UseCopyReturn {
  copiedId: string | null;
  handleCopy: (text: string, id: string) => Promise<void>;
}

export const useCopy = (): UseCopyReturn => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(stripHtml(text));
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return {
    copiedId,
    handleCopy
  };
}; 