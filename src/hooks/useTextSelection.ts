import { useState, useEffect, useCallback, useRef } from "react";

// Simple debounce utility function
function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return function(...args: any[]) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

interface Position {
  x: number;
  y: number;
}

interface TextSelectionState {
  selectedText: string;
  position: Position;
  isVisible: boolean;
  selectionRange: Range | null;
}

// Button dimensions and positioning constants
const BUTTON_SIZE = 32; // Size of the circular button
const BUTTON_HORIZONTAL_OFFSET = 30; // Keep button 10px to the left of selection
const BUTTON_VERTICAL_OFFSET = 30; // Keep button 40px above selection
const VIEWPORT_MARGIN = 5; // Minimum distance from viewport edges

/**
 * Helper function to calculate document-based position from a Range
 * @param range The selection range
 * @returns Position in document coordinates
 */
function calculateDocumentPosition(range: Range): Position {
  // Get the rectangle in viewport coordinates
  const rect = range.getBoundingClientRect();
  
  // Convert to document coordinates by adding scroll offset
  return {
    // Position to the left of selection
    x: rect.left + window.pageXOffset - BUTTON_HORIZONTAL_OFFSET,
    // Position above the selection
    y: rect.top + window.pageYOffset - BUTTON_VERTICAL_OFFSET
  };
}

/**
 * Hook to detect and manage text selection in the document
 * @param minLength Minimum length of selected text to show the button
 * @returns Text selection state and functions to manage visibility
 */
export const useTextSelection = (minLength = 3) => {
  const [selectionState, setSelectionState] = useState<TextSelectionState>({
    selectedText: "",
    position: { x: 0, y: 0 },
    isVisible: false,
    selectionRange: null
  });

  // Effect to handle selection positioning and keep it in sync with the document
  useEffect(() => {
    // Store the current selected range for repositioning during scroll/resize
    let savedRange: Range | null = selectionState.selectionRange;
    
    // Detect clicks outside the button to hide it
    const handlePageClick = (e: MouseEvent) => {
      if (!selectionState.isVisible) return;
      
      // Check if the click was on the button or any of its children
      const buttonElement = document.getElementById('lightup-selection-btn');
      if (buttonElement && (buttonElement.contains(e.target as Node) || buttonElement === e.target)) {
        // Important: We want to preserve the selection when interacting with the button
        e.stopPropagation(); // Stop event bubbling
        return; // Ignore clicks on the button itself
      }
      
      // Hide the button when clicking elsewhere
      setSelectionState(prev => ({
        ...prev,
        isVisible: false
      }));
      
      // We'll let the browser handle clearing the selection naturally
      // This prevents the highlighting from disappearing when clicking on the button
      // window.getSelection()?.removeAllRanges(); // Removed this line
    };
    
    // Update the button position when scrolling to keep it with the text
    const handleScroll = debounce(() => {
      if (!selectionState.isVisible || !savedRange) return;
      
      // Recalculate position based on the saved range
      const newPosition = calculateDocumentPosition(savedRange);
      
      // Update the position
      setSelectionState(prev => ({
        ...prev,
        position: newPosition
      }));
    }, 10); // Use small delay for smooth updates
    
    // Handle window resize - recalculate position
    const handleResize = debounce(() => {
      if (!selectionState.isVisible || !savedRange) return;
      
      // Recalculate position based on the saved range
      const newPosition = calculateDocumentPosition(savedRange);
      
      // Update the position
      setSelectionState(prev => ({
        ...prev,
        position: newPosition
      }));
    }, 100);
    
    // Listen for events
    document.addEventListener('click', handlePageClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    return () => {
      document.removeEventListener('click', handlePageClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [selectionState.isVisible, selectionState.selectionRange]);
  
  // Track last known mouse position for fallback positioning
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  
  // Track mouse position for fallback
  useEffect(() => {
    const trackMousePosition = (e: MouseEvent) => {
      lastMousePositionRef.current = {
        x: e.pageX,
        y: e.pageY
      };
    };
    
    document.addEventListener('mousemove', trackMousePosition);
    return () => {
      document.removeEventListener('mousemove', trackMousePosition);
    };
  }, []);
  
  // Handle selections that might come from other sources (like keyboard)
  const handleSelectionWithFallback = useCallback(() => {
    const selection = window.getSelection();
    let selectedText = selection?.toString().trim() || "";

    // Apply basic cleaning to remove obvious non-content
    if (selectedText) {
      selectedText = selectedText
        // Remove script content that might be accidentally selected
        .replace(/window\.dataLayer[\s\S]*?;/g, '')
        .replace(/gtag\([^)]*\)\s*;?/g, '')
        .replace(/function\s+gtag\(\)[\s\S]*?\}/g, '')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (selectedText.length >= minLength) {
      // Store the range to preserve the selection
      let clonedRange = null;
      let position;
      
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        clonedRange = range.cloneRange();
        
        // Calculate document-based position
        position = calculateDocumentPosition(range);
      } else {
        // If we can't get a selection range, use the last mouse position
        // as a fallback
        position = {
          x: lastMousePositionRef.current.x - BUTTON_HORIZONTAL_OFFSET,
          y: lastMousePositionRef.current.y - BUTTON_VERTICAL_OFFSET
        };
      }
      
      setSelectionState({
        selectedText,
        position,
        isVisible: true,
        selectionRange: clonedRange
      });
    }
  }, [minLength]);
  
  // Update position when text is selected with mouse - using document coordinates
  const handleTextSelection = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    let selectedText = selection?.toString().trim() || "";

    // Apply basic cleaning to remove obvious non-content
    if (selectedText) {
      selectedText = selectedText
        // Remove script content that might be accidentally selected
        .replace(/window\.dataLayer[\s\S]*?;/g, '')
        .replace(/gtag\([^)]*\)\s*;?/g, '')
        .replace(/function\s+gtag\(\)[\s\S]*?\}/g, '')
        // Clean up whitespace
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Only proceed if there's sufficient text selected
    if (selectedText.length >= minLength) {
      // Use setTimeout to ensure the selection has been fully processed
      setTimeout(() => {
        // Default to mouse position
        let position: Position;
        let selRange: Range | null = null;
        
        // Use selection rect if available
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          selRange = range.cloneRange();
          
          // Calculate document-based position
          position = calculateDocumentPosition(range);
          
          // Apply viewport clamping to ensure button stays in view
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Convert document position to viewport for boundary checking
          let vpX = position.x - window.pageXOffset;
          let vpY = position.y - window.pageYOffset;
          
          // Apply viewport boundaries
          vpX = Math.max(VIEWPORT_MARGIN, Math.min(viewportWidth - BUTTON_SIZE - VIEWPORT_MARGIN, vpX));
          vpY = Math.max(VIEWPORT_MARGIN, Math.min(viewportHeight - BUTTON_SIZE - VIEWPORT_MARGIN, vpY));
          
          // Convert back to document coordinates
          position = {
            x: vpX + window.pageXOffset,
            y: vpY + window.pageYOffset
          };
        } else {
          // Fallback to mouse position (already in document coordinates from pageX/Y)
          position = {
            x: lastMousePositionRef.current.x - BUTTON_HORIZONTAL_OFFSET,
            y: lastMousePositionRef.current.y - BUTTON_VERTICAL_OFFSET
          };
          
          // Apply viewport clamping
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          // Convert to viewport coordinates for boundary checking
          let vpX = position.x - window.pageXOffset;
          let vpY = position.y - window.pageYOffset;
          
          // Apply viewport boundaries
          vpX = Math.max(VIEWPORT_MARGIN, Math.min(viewportWidth - BUTTON_SIZE - VIEWPORT_MARGIN, vpX));
          vpY = Math.max(VIEWPORT_MARGIN, Math.min(viewportHeight - BUTTON_SIZE - VIEWPORT_MARGIN, vpY));
          
          // Convert back to document coordinates
          position = {
            x: vpX + window.pageXOffset,
            y: vpY + window.pageYOffset
          };
        }
        
        setSelectionState({
          selectedText,
          position,
          isVisible: true,
          selectionRange: selRange
        });
      }, 10); // Small delay for stability
    }
  }, [minLength]);

  // We're removing the automatic selectionChange handler since it causes
  // the button to disappear when clicking on it. Instead, we'll only update
  // when we specifically want to (mouse up events)
  
  // This is intentionally left empty to improve stability

  // Setup event listeners for mouse and selection events
  useEffect(() => {
    // Use mouseup for detecting the end of a selection action
    // This approach will work with the mouse position
    document.addEventListener("mouseup", handleTextSelection);
    
    return () => {
      document.removeEventListener("mouseup", handleTextSelection);
    };
  }, [handleTextSelection]);

  // Function to manually hide the button
  const hideSelectionButton = useCallback(() => {
    setSelectionState(prev => ({ ...prev, isVisible: false }));
  }, []);

  return {
    selectedText: selectionState.selectedText,
    position: selectionState.position,
    isVisible: selectionState.isVisible,
    selectionRange: selectionState.selectionRange,
    setIsVisible: (visible: boolean) => {
      setSelectionState(prev => ({ ...prev, isVisible: visible }));
    },
    hideSelectionButton
  };
};
