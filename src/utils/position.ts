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

  // Calculate available space below and to the right
  const spaceBelow = viewportHeight - clientY;
  const spaceRight = viewportWidth - clientX;

  // Calculate final position
  let top = clientY + padding;
  let left = clientX;

  // If not enough space below, position above
  if (spaceBelow < popupHeight + padding) {
    top = clientY - popupHeight - padding;
  }

  // If not enough space to the right, position to the left
  if (spaceRight < popupWidth + padding) {
    left = clientX - popupWidth - padding;
  }

  return {
    top: Math.max(padding, Math.min(viewportHeight - popupHeight - padding, top)),
    left: Math.max(padding, Math.min(viewportWidth - popupWidth - padding, left))
  };
}; 