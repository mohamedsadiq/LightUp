/**
 * Common styles for LightUp extension
 * Reusable CSS variables and hover effects
 */

// ============================================================================
// CSS Variables for Green Hover Effects
// ============================================================================

export const greenHoverStyles = `
  &:hover {
    border-color: var(--popup-toggle-active);
    box-shadow: 0 4px 12px rgba(45, 202, 110, 0.15);
  }

  &:focus-visible {
    border-color: var(--popup-toggle-active);
    outline: 2px solid var(--popup-toggle-active);
    outline-offset: 2px;
  }
`;

// ============================================================================
// Common Mixins
// ============================================================================

export const interactiveCard = `
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  ${greenHoverStyles}

  &:active {
    transform: scale(0.99);
  }
`;

export const selectedCard = `
  border-color: var(--popup-toggle-active);
  box-shadow: 0 4px 12px rgba(45, 202, 110, 0.15);
`;

export const focusRing = `
  &:focus-visible {
    outline: 2px solid var(--popup-toggle-active);
    outline-offset: 2px;
  }
`;
