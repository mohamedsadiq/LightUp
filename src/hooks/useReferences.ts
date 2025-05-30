import { useState, useCallback } from 'react';
import type { ReferenceItem } from '../components/content/ReferencesContainer';

export interface UseReferencesReturn {
  references: ReferenceItem[];
  addReference: (content: string) => number;
  clearReferences: () => void;
  getReference: (id: number) => ReferenceItem | undefined;
}

export const useReferences = (): UseReferencesReturn => {
  const [references, setReferences] = useState<ReferenceItem[]>([]);

  const addReference = useCallback((content: string): number => {
    const newId = references.length > 0 ? Math.max(...references.map(ref => ref.id)) + 1 : 1;
    
    // Check if content already exists
    const existingRef = references.find(ref => ref.content === content);
    if (existingRef) {
      return existingRef.id;
    }
    
    const newReference: ReferenceItem = { id: newId, content };
    setReferences(prev => [...prev, newReference]);
    return newId;
  }, [references]);

  const clearReferences = useCallback(() => {
    setReferences([]);
  }, []);

  const getReference = useCallback((id: number) => {
    return references.find(ref => ref.id === id);
  }, [references]);

  return {
    references,
    addReference,
    clearReferences,
    getReference
  };
};

export default useReferences; 