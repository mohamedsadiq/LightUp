interface Position {
  top: number;
  left: number;
}

interface ViewportBounds {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

interface PopupDimensions {
  width: number;
  height: number;
}

interface PositionOptions {
  margin?: number;
  preferredX?: number;
  preferredY?: number;
  coordinateSpace?: "document" | "viewport";
}

// Get current viewport bounds including scroll position
const getViewportBounds = (): ViewportBounds => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollX: window.scrollX || window.pageXOffset || 0,
    scrollY: window.scrollY || window.pageYOffset || 0
  };
};

// Check if popup fits within viewport bounds
const checkViewportBounds = (
  position: Position,
  dimensions: PopupDimensions,
  viewport: ViewportBounds,
  margin: number = 8
): { fitsX: boolean; fitsY: boolean } => {
  const rightEdge = position.left + dimensions.width + margin;
  const bottomEdge = position.top + dimensions.height + margin;
  
  return {
    fitsX: position.left >= margin && rightEdge <= viewport.width,
    fitsY: position.top >= margin && bottomEdge <= viewport.height
  };
};

// Adjust position to fit within viewport bounds
const adjustPositionForViewport = (
  position: Position,
  dimensions: PopupDimensions,
  viewport: ViewportBounds,
  margin: number = 8
): Position => {
  let { left, top } = position;
  
  // Handle case where popup is larger than viewport
  if (dimensions.width > viewport.width - (margin * 2)) {
    // Center horizontally if popup is wider than viewport
    left = (viewport.width - dimensions.width) / 2;
  } else {
    // Adjust horizontal position
    if (left < margin) {
      left = margin;
    } else if (left + dimensions.width + margin > viewport.width) {
      left = viewport.width - dimensions.width - margin;
    }
  }
  
  if (dimensions.height > viewport.height - (margin * 2)) {
    // Center vertically if popup is taller than viewport
    top = (viewport.height - dimensions.height) / 2;
  } else {
    // Adjust vertical position
    if (top < margin) {
      top = margin;
    } else if (top + dimensions.height + margin > viewport.height) {
      top = viewport.height - dimensions.height - margin;
    }
  }
  
  return { left, top };
};

// Calculate optimal position based on selection or mouse position
export const calculatePosition = (
  clientX: number,
  clientY: number,
  dimensions: PopupDimensions = { width: 350, height: 460 },
  options: PositionOptions = {}
): Position => {
  const { margin = 8, preferredX, preferredY, coordinateSpace = "document" } = options;
  const viewport = getViewportBounds();
  const scrollX = coordinateSpace === "viewport" ? 0 : viewport.scrollX;
  const scrollY = coordinateSpace === "viewport" ? 0 : viewport.scrollY;
  
  let proposedPosition: Position;
  
  // If preferred position is provided, use it
  if (preferredX !== undefined && preferredY !== undefined) {
    proposedPosition = { left: preferredX, top: preferredY };
  } else {
    // Try to get the selection's bounding rectangle
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // If we have a valid selection rectangle, use it instead of mouse position
      if (rect && rect.width > 0 && rect.height > 0) {
        // Position the popup at the bottom right of the selection by default
        let top = rect.bottom + scrollY + margin;
        let left = rect.right + scrollX - dimensions.width / 2;
        
        // Try different positions if selection-based positioning doesn't fit
        const positions = [
          // Below and centered
          { left: rect.right + scrollX - dimensions.width / 2, top: rect.bottom + scrollY + margin },
          // Above and centered
          { left: rect.right + scrollX - dimensions.width / 2, top: rect.top + scrollY - dimensions.height - margin },
          // To the right
          { left: rect.right + scrollX + margin, top: rect.top + scrollY },
          // To the left
          { left: rect.left + scrollX - dimensions.width - margin, top: rect.top + scrollY },
          // Below and aligned left
          { left: rect.left + scrollX, top: rect.bottom + scrollY + margin },
          // Above and aligned left
          { left: rect.left + scrollX, top: rect.top + scrollY - dimensions.height - margin }
        ];
        
        // Find the first position that fits
        for (const pos of positions) {
          const bounds = checkViewportBounds(pos, dimensions, viewport, margin);
          if (bounds.fitsX && bounds.fitsY) {
            proposedPosition = pos;
            break;
          }
        }
        
        // If none of the preferred positions fit, use the first one and let adjustment handle it
        if (!proposedPosition!) {
          proposedPosition = positions[0];
        }
      } else {
        // Fallback to mouse position
        proposedPosition = {
          left: clientX + scrollX,
          top: clientY + scrollY + margin
        };
      }
    } else {
      // Fallback to mouse position
      proposedPosition = {
        left: clientX + scrollX,
        top: clientY + scrollY + margin
      };
    }
  }
  
  // Adjust position to ensure it fits within viewport
  const finalPosition = adjustPositionForViewport(proposedPosition, dimensions, viewport, margin);
  
  return finalPosition;
};

// Enhanced calculate position with viewport awareness for floating mode
export const calculateFloatingPosition = (
  clientX: number,
  clientY: number,
  actualDimensions: PopupDimensions,
  options: PositionOptions = {}
): Position => {
  return calculatePosition(clientX, clientY, actualDimensions, {
    ...options,
    coordinateSpace: "viewport"
  });
};

// Utility to check if a position needs adjustment
export const needsRepositioning = (
  position: Position,
  dimensions: PopupDimensions,
  margin: number = 8
): boolean => {
  const viewport = getViewportBounds();
  const bounds = checkViewportBounds(position, dimensions, viewport, margin);
  return !bounds.fitsX || !bounds.fitsY;
};

// Utility to get safe position within viewport
export const getSafePosition = (
  position: Position,
  dimensions: PopupDimensions,
  margin: number = 8
): Position => {
  const viewport = getViewportBounds();
  return adjustPositionForViewport(position, dimensions, viewport, margin);
}; 