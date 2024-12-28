import { useState, useEffect, useCallback, useRef } from "react"
import { useSettings } from "./useSettings"
import { Storage } from "@plasmohq/storage"
import debounce from "lodash/debounce"

export const useContextAwareness = () => {
  const { settings } = useSettings()
  const [pageContext, setPageContext] = useState<string>("")
  const [isInitialized, setIsInitialized] = useState(false)
  const isEnabled = settings?.customization?.contextAwareness ?? false
  const contextLimit = settings?.customization?.contextLimit ?? 1000
  const storage = useRef(new Storage()).current
  const lastStoredContext = useRef<string>("")
  const debugRef = useRef({
    extractedContent: "",
    storedContent: "",
    currentState: ""
  })

  // Function to clean and normalize text content
  const cleanText = useCallback((text: string): string => {
    // Remove excessive whitespace and normalize line endings
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }, []);

  // Function to extract visible text content from the page
  const extractPageContent = useCallback(() => {
    console.log("Context Awareness: Extracting page content");
    
    // Get all text nodes that are visible
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip hidden elements
          const element = node.parentElement;
          if (!element) return NodeFilter.FILTER_REJECT;
          
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip script and style tags
          if (['SCRIPT', 'STYLE', 'META', 'LINK'].includes(element.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let textContent = '';
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent?.trim();
      if (text) {
        textContent += text + ' ';
      }
    }

    // Clean and limit the text
    const cleanedText = cleanText(textContent);
    const trimmedText = cleanedText.slice(0, contextLimit);
    
    debugRef.current.extractedContent = trimmedText;
    console.log(`Context Awareness: Extracted ${trimmedText.length} characters of content`);
    console.log("Context Awareness: Content preview:", trimmedText.substring(0, 100) + "...");
    
    return trimmedText;
  }, [contextLimit, cleanText]);

  // Function to update context in both state and storage
  const updateContextData = useCallback(async (newContext: string) => {
    console.log("Context Awareness: Updating context data", { 
      length: newContext.length,
      preview: newContext.substring(0, 100) + "..."
    });
    
    // Update state immediately
    setPageContext(newContext);
    debugRef.current.currentState = newContext;

    // Only update storage if content has changed
    if (newContext !== lastStoredContext.current) {
      try {
        console.log("Context Awareness: Updating storage with content length:", newContext.length);
        console.log("Context Awareness: Storage content preview:", newContext.substring(0, 100) + "...");
        await storage.set("pageContext", newContext);
        lastStoredContext.current = newContext;
        debugRef.current.storedContent = newContext;
        console.log("Context Awareness: Context stored in storage successfully");
      } catch (error) {
        console.error("Context Awareness: Storage update failed", error);
      }
    } else {
      console.log("Context Awareness: Skipping storage update - no changes");
    }
  }, [storage]);

  // Initialize context on mount
  useEffect(() => {
    let isMounted = true;
    
    const initializeContext = async () => {
      if (!isEnabled) {
        console.log("Context Awareness: Disabled during initialization");
        setPageContext("");
        await storage.remove("pageContext");
        setIsInitialized(true);
        return;
      }

      console.log("Context Awareness: Initializing");
      try {
        const storedContext = await storage.get("pageContext") as string;
        console.log("Context Awareness: Retrieved from storage:", {
          hasStoredContext: !!storedContext,
          storedLength: storedContext?.length
        });
        
        if (storedContext && isMounted) {
          console.log("Context Awareness: Using stored context", {
            contextLength: storedContext.length,
            preview: storedContext.substring(0, 100) + "..."
          });
          await updateContextData(storedContext);
        } else if (isMounted) {
          console.log("Context Awareness: No stored context, extracting new");
          const newContext = extractPageContent();
          await updateContextData(newContext);
        }
      } catch (error) {
        console.error("Context Awareness: Error during initialization", error);
        if (isMounted) {
          const newContext = extractPageContent();
          await updateContextData(newContext);
        }
      }
      
      if (isMounted) {
        setIsInitialized(true);
      }
    };

    initializeContext();
    return () => {
      isMounted = false;
    };
  }, [isEnabled, extractPageContent, updateContextData, storage]);

  // Update context when enabled/disabled or limit changes
  useEffect(() => {
    if (!isInitialized) return;

    console.log("Context Awareness Status:", { 
      isEnabled, 
      contextLimit,
      currentContextLength: pageContext.length 
    });
    
    const updateContext = async () => {
      if (isEnabled) {
        console.log("Context Awareness: Enabled, updating page context");
        const newContext = extractPageContent();
        await updateContextData(newContext);
      } else {
        console.log("Context Awareness: Disabled, clearing context");
        setPageContext("");
        await storage.remove("pageContext");
        lastStoredContext.current = "";
        debugRef.current = {
          extractedContent: "",
          storedContent: "",
          currentState: ""
        };
      }
    };

    updateContext();
  }, [isEnabled, contextLimit, extractPageContent, isInitialized, updateContextData, storage]);

  // Function to get relevant context for highlighted text
  const getRelevantContext = useCallback((highlightedText: string): string => {
    const currentContext = pageContext || debugRef.current.currentState;
    
    console.log("Context Awareness: Getting context for highlighted text", { 
      isEnabled, 
      hasPageContext: !!currentContext,
      highlightedTextLength: highlightedText.length,
      contextLength: currentContext.length,
      isInitialized,
      preview: currentContext.substring(0, 100) + "..."
    });

    if (!isEnabled || !currentContext || !isInitialized) {
      console.log("Context Awareness: Cannot get context - disabled or no context available");
      return ""
    }

    // Find the position of highlighted text in the page context
    const textPosition = currentContext.indexOf(highlightedText)
    console.log("Context Awareness: Text position in context:", textPosition);
    
    if (textPosition === -1) {
      console.log("Context Awareness: Highlighted text not found in context");
      return ""
    }

    // Get surrounding context (100 chars before and after)
    const contextStart = Math.max(0, textPosition - 100)
    const contextEnd = Math.min(currentContext.length, textPosition + highlightedText.length + 100)
    const relevantContext = currentContext.slice(contextStart, contextEnd)
    
    console.log("Context Awareness: Found relevant context", {
      contextLength: relevantContext.length,
      preview: relevantContext
    });
    
    // Format the context to make it clear what's being sent
    return `Context from page about "${highlightedText}": ${relevantContext}`;
  }, [isEnabled, pageContext, isInitialized]);

  // Function to manually refresh context
  const refreshContext = useCallback(async () => {
    if (!isEnabled) {
      console.log("Context Awareness: Cannot refresh - disabled");
      return;
    }
    
    console.log("Context Awareness: Manual refresh requested");
    const newContext = extractPageContent();
    await updateContextData(newContext);
    console.log("Context Awareness: Context manually refreshed", {
      newContextLength: newContext.length,
      preview: newContext.substring(0, 100) + "..."
    });
  }, [isEnabled, extractPageContent, updateContextData]);

  return {
    isEnabled,
    pageContext,
    getRelevantContext,
    refreshContext,
    isInitialized
  }
} 