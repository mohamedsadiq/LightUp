import { useState, useEffect } from 'react';
import { Storage } from "@plasmohq/storage";

interface UseEnabledReturn {
  isEnabled: boolean;
  handleEnabledChange: (newState: boolean) => Promise<void>;
}

export const useEnabled = (onStateChange?: (message: string) => void): UseEnabledReturn => {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    const loadEnabledState = async () => {
      const storage = new Storage();
      const savedState = await storage.get("isEnabled");
      if (savedState !== undefined) {
        setIsEnabled(savedState === "true");
      }
    };

    loadEnabledState();
  }, []);

  const handleEnabledChange = async (newState: boolean) => {
    setIsEnabled(newState);
    const storage = new Storage();
    await storage.set("isEnabled", newState.toString());
    
    if (onStateChange) {
      onStateChange(`LightUp ${newState ? 'enabled' : 'disabled'} (Ctrl+Shift+X)`);
    }
  };

  return {
    isEnabled,
    handleEnabledChange
  };
}; 