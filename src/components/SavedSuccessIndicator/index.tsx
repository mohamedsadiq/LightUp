import { getMessage } from "~utils/i18n";

interface SavedSuccessIndicatorProps {
  message?: string;
}

/**
 * Reusable component for displaying a success/saved indicator with localization support
 */
export const SavedSuccessIndicator: React.FC<SavedSuccessIndicatorProps> = ({ message }) => {
  const displayMessage = message || getMessage("savedSuccessText") || "Saved!";
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', fontWeight: 500, color: '#2DCA6E' }}>
      <svg style={{ height: '20px', width: '20px', color: '#2DCA6E', marginRight: '6px' }} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      {displayMessage}
    </div>
  );
};

export default SavedSuccessIndicator;
