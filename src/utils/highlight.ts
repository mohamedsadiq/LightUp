// Define color mapping
const highlightColors = {
  default: '#fff8bc',  // Light yellow
  orange: '#FFBF5A',
  blue: '#93C5FD',
  green: '#86EFAC',
  purple: '#C4B5FD',
  pink: '#FDA4AF'
} as const;

type HighlightColor = keyof typeof highlightColors;

// Map of highlight color options to their CSS color values
export const HIGHLIGHT_COLORS = {
  default: '#fff8bc',  // Light yellow
  orange: '#FFBF5A',
  blue: '#93C5FD',
  green: '#86EFAC',
  purple: '#C4B5FD',
  pink: '#FDA4AF'
} as const;

export type HighlightColorOption = keyof typeof HIGHLIGHT_COLORS;

// Function to get the highlight color value
export const getHighlightColor = (option: HighlightColorOption | undefined): string => {
  if (!option || option === 'default') {
    return HIGHLIGHT_COLORS.default;
  }
  return HIGHLIGHT_COLORS[option];
};

export const applyHighlightColor = (color: string | undefined, isEnabled: boolean) => {
  const selectionStyle = document.createElement('style');
  selectionStyle.id = 'lightup-selection-style';
  
  if (!isEnabled) {
    // When disabled, use default system selection color
    selectionStyle.textContent = `
      ::selection {
        /* Use default system selection color */
      }
      
      ::-moz-selection {
        /* Use default system selection color */
      }
    `;
  } else {
    // Get the color from the mapping or use the provided color directly
    const highlightColor = (!color || color === 'default') 
      ? HIGHLIGHT_COLORS.default 
      : (HIGHLIGHT_COLORS[color as HighlightColor] || color);
    
    selectionStyle.textContent = `
      ::selection {
        background-color: ${highlightColor} !important;
        color: #000000 !important;
      }
      
      ::-moz-selection {
        background-color: ${highlightColor} !important;
        color: #000000 !important;
      }
    `;
  }

  // Remove any existing selection style
  document.getElementById('lightup-selection-style')?.remove();
  document.head.appendChild(selectionStyle);

  return () => {
    document.getElementById('lightup-selection-style')?.remove();
  };
}; 