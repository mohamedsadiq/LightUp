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
    
    // Listen for real-time changes to the enabled state
    const handleEnabledChanged = (event: CustomEvent) => {
      if (event.detail?.isEnabled !== undefined) {
        setIsEnabled(event.detail.isEnabled);
        
        if (onStateChange) {
          onStateChange(`LightUp ${event.detail.isEnabled ? 'enabled' : 'disabled'} (Ctrl+Shift+X)`);
        }
      }
    };
    
    // Also listen for the extension state changed event from the popup
    const handleExtensionStateChanged = (event: CustomEvent) => {
      if (event.detail?.enabled !== undefined) {
        setIsEnabled(event.detail.enabled);
        
        if (onStateChange) {
          onStateChange(`LightUp ${event.detail.enabled ? 'enabled' : 'disabled'} (Ctrl+Shift+X)`);
        }
      }
    };
    
    window.addEventListener('isEnabledChanged', handleEnabledChanged as EventListener);
    window.addEventListener('extensionStateChanged', handleExtensionStateChanged as EventListener);
    
    return () => {
      window.removeEventListener('isEnabledChanged', handleEnabledChanged as EventListener);
      window.removeEventListener('extensionStateChanged', handleExtensionStateChanged as EventListener);
    };
  }, [onStateChange]);

  const handleEnabledChange = async (newState: boolean) => {
    // Update state immediately for UI responsiveness
    setIsEnabled(newState);
    
    // Dispatch events immediately for real-time updates across all components
    window.dispatchEvent(
      new CustomEvent('isEnabledChanged', { detail: { isEnabled: newState } })
    );
    
    // Also dispatch the event for the content script immediately
    window.dispatchEvent(
      new CustomEvent('extensionStateChanged', { detail: { enabled: newState } })
    );
    
    // Show notification if callback is provided
    if (onStateChange) {
      onStateChange(`LightUp ${newState ? 'enabled' : 'disabled'} (Ctrl+Shift+X)`);
    }
    
    try {
      // Update storage asynchronously (after UI is already updated)
      const storage = new Storage();
      await storage.set("isEnabled", newState.toString());
      console.log('Extension enabled state saved to storage:', newState);
      
      // Notify all browser tabs about the state change
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { 
                type: "EXTENSION_STATE_CHANGED", 
                enabled: newState
              }).catch(err => {
                // Ignore errors for tabs that don't have the content script running
                console.log(`Could not send message to tab ${tab.id}:`, err);
              });
            }
          });
        });
      }
    } catch (error) {
      console.error('Failed to update extension state in storage:', error);
    }
  };

  return {
    isEnabled,
    handleEnabledChange
  };
}; 