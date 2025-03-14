interface Position {
  top: number;
  left: number;
}

export const calculatePosition = (clientX: number, clientY: number): Position => {
  const padding = 20;
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const popupHeight = 400; // Maximum height of popup
  const popupWidth = 340;  // Width of popup

  // Try to get the selection's bounding rectangle
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // If we have a valid selection rectangle, use it instead of mouse position
    if (rect && rect.width > 0 && rect.height > 0) {
      // Position the popup at the bottom right of the selection by default
      let top = rect.bottom + padding;
      let left = rect.right - popupWidth / 2;
      
      // If not enough space below, position above
      if (viewportHeight - rect.bottom < popupHeight + padding) {
        top = rect.top - popupHeight - padding;
      }
      
      // If not enough space to the right, adjust horizontally
      if (viewportWidth - rect.right < popupWidth / 2) {
        left = viewportWidth - popupWidth - padding;
      } else if (rect.right - popupWidth / 2 < padding) {
        left = padding;
      }
      
      return {
        top: Math.max(padding, Math.min(viewportHeight - popupHeight - padding, top)),
        left: Math.max(padding, Math.min(viewportWidth - popupWidth - padding, left))
      };
    }
  }
  
  // Fallback to mouse position if selection rectangle is not available
  let top = clientY + padding;
  let left = clientX;

  // If not enough space below, position above
  if (viewportHeight - clientY < popupHeight + padding) {
    top = clientY - popupHeight - padding;
  }

  // If not enough space to the right, position to the left
  if (viewportWidth - clientX < popupWidth + padding) {
    left = clientX - popupWidth - padding;
  }

  return {
    top: Math.max(padding, Math.min(viewportHeight - popupHeight - padding, top)),
    left: Math.max(padding, Math.min(viewportWidth - popupWidth - padding, left))
  };
}; 