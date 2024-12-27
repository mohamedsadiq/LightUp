// Define color mapping
const highlightColors = {
  default: 'default',
  orange: '#FFBF5A',
  blue: '#93C5FD',
  green: '#86EFAC',
  purple: '#C4B5FD',
  pink: '#FDA4AF'
} as const;

type HighlightColor = keyof typeof highlightColors;

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
  } else if (!color || color === 'default' || highlightColors[color as HighlightColor] === 'default') {
    // For default option, remove any custom styles to use system default
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
    const highlightColor = highlightColors[color as HighlightColor] || color;
    
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