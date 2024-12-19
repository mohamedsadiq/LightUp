import { THEME_COLORS } from "~utils/constants";

export const getStyles = (theme: "light" | "dark") => ({
  popup: {
    width: "300px",
    height: "auto",
    padding: 20,
    background: THEME_COLORS[theme].background,
    border: `1px solid ${THEME_COLORS[theme].border}`,
    borderRadius: 13,
    boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
    maxWidth: 500,
    fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxHeight: "400px",
    overflow: "auto",
  },
  buttonContainer: {
    height: "fit-content",
    minHeight: 40,
    zIndex: 9999
  },
  buttonContainerParent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: 43
  },
  button: {
    width: 19,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 4,
    fontFamily: "'K2D', sans-serif",
  },
  text: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: "0 0 16px 0",
    color: THEME_COLORS[theme].text,
    fontFamily: "'K2D', sans-serif"
  },
  explanation: {
    fontSize: 12,
    lineHeight: 1.6,
    color: THEME_COLORS[theme].text,
    backgroundColor: THEME_COLORS[theme].popupBackground,
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    fontFamily: "'K2D', sans-serif",
    marginBottom: 16
  },
  followUpQA: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  error: {
    color: 'red',
    fontSize: 14,
    marginTop: 8,
    fontFamily: "'K2D', sans-serif"
  },
  loadingText: {
    fontFamily: "'K2D', sans-serif",
    fontSize: 14,
    color: THEME_COLORS[theme].secondaryText,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  searchContainer: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'K2D', sans-serif",
    backgroundColor: theme === "light" ? "#FFFFFF" : THEME_COLORS[theme].buttonBackground,
    padding: "8px 12px",
    borderRadius: "31px",
    marginTop: "12px",
    border: theme === "light" ? "1px solid #E5E5E5" : "none",
  },
  searchSendButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    minWidth: "36px",
    height: "36px",
    borderRadius: "50%",
    transition: "all 0.2s ease",
    color: theme === "light" ? "#2C2C2C" : "#fff",
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
    }
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    fontSize: 14,
    fontFamily: "'K2D', sans-serif",
    backgroundColor: "transparent",
    color: THEME_COLORS[theme].text,
    outline: "none",
    width: "100%",
    "&::placeholder": {
      color: THEME_COLORS[theme].secondaryText
    }
  },
  followUpQuestion: {
    backgroundColor: THEME_COLORS[theme].buttonBackground,
    color: THEME_COLORS[theme].text,
    padding: '8px 12px',
    borderRadius: '18px',
    borderBottomRightRadius: '4px',
    maxWidth: '85%',
    marginTop: "17px",
    marginLeft: 'auto',
    marginBottom: '8px',
    fontSize: '12px',
    fontFamily: "'K2D', sans-serif",
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  followUpAnswer: {
    backgroundColor: THEME_COLORS[theme].popupBackground,
    color: THEME_COLORS[theme].text,
    padding: '8px 12px',
    borderRadius: '18px',
    borderBottomLeftRadius: '4px',
    maxWidth: '85%',
    marginRight: 'auto',
    fontSize: '12px',
    lineHeight: 1.6,
    fontFamily: "'K2D', sans-serif",
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  // ... rest of the existing styles with theme colors
  popupContainer: {
    position: 'fixed' as const,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    zIndex: 9999,
  },
  popupPositioner: {
    position: 'fixed' as const,
    maxHeight: '80vh',
    pointerEvents: 'auto' as const,
  },
  // ... all other existing styles
  followUpInputContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    backgroundColor: 'transparent',
    borderRadius: '12px',
    width: "100%",
  },
});

export const styles = getStyles("light"); // Default theme