import { THEME_COLORS } from "~utils/constants";

export const getStyles = (theme: "light" | "dark", textDirection: "ltr" | "rtl" = "ltr", fontSize: "0.8rem" | "0.9rem" | "1rem" = "1rem") => ({
  popup: {
    width: "340px",
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
    fontSize: fontSize
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
    fontSize: fontSize,
    lineHeight: 1.5,
    margin: "0 0 16px 0",
    color: THEME_COLORS[theme].text,
    fontFamily: "'K2D', sans-serif"
  },
  explanation: {
    fontSize: fontSize,
    lineHeight: 1.6,
    color: THEME_COLORS[theme].text,
    backgroundColor: THEME_COLORS[theme].popupBackground,
    padding: "5px 9px",
    borderRadius: 8,
    // marginTop: 16,
    fontFamily: "'K2D', sans-serif",
    marginBottom: 16,
    direction: textDirection,
    textAlign: textDirection === "rtl" ? "right" : "left" as const
  },
  followUpQA: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    width: '100%',
    position: 'relative' as const,
    perspective: '1000px',
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
    padding: "12px 16px",
    borderRadius: "31px",
    // border: theme === "light" ? "1px solid #E5E5E5" : "1px solid transparent",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "all 0.2s ease",
    transform: 'translateZ(0)',
    willChange: 'transform',
    "&:focus-within": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      transform: "translateY(-2px)",
    }
  },
  searchSendButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    minWidth: "40px",
    height: "40px",
    borderRadius: "50%",
    transition: "all 0.2s ease",
    color: theme === "light" ? "#2C2C2C" : "#fff",
    transform: 'translateZ(0)',
    willChange: 'transform, opacity',
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
      color: theme === "light" ? "rgba(44, 44, 44, 0.5)" : "rgba(255, 255, 255, 0.5)",
    },
    "&:hover:not(:disabled)": {
      backgroundColor: "rgba(0, 0, 0, 0.05)",
      color: theme === "light" ? "#000" : "#fff",
    },
    "&:active:not(:disabled)": {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      transform: "scale(0.95)",
    },
    "& svg": {
      transition: "transform 0.2s ease",
      transformOrigin: "center",
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
    transition: "opacity 0.2s ease",
    "&::placeholder": {
      color: THEME_COLORS[theme].secondaryText,
      transition: "color 0.2s ease"
    },
    "&:focus::placeholder": {
      color: "transparent"
    },
    "&:disabled": {
      cursor: "not-allowed",
      opacity: 0.7
    }
  },
  followUpQuestion: {
    backgroundColor: THEME_COLORS[theme].buttonBackground,
    color: THEME_COLORS[theme].text,
    padding: '12px 16px',
    borderRadius: '18px',
    borderBottomRightRadius: '4px',
    maxWidth: '85%',
    marginTop: "17px",
    marginLeft: 'auto',
    marginBottom: '8px',
    fontSize: fontSize,
    fontFamily: "'K2D', sans-serif",
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    direction: textDirection,
    textAlign: textDirection === "rtl" ? "right" : "left" as const,
    transform: 'translateZ(0)',
    willChange: 'transform',
  },
  followUpAnswer: {
    backgroundColor: THEME_COLORS[theme].popupBackground,
    color: THEME_COLORS[theme].text,
    padding: '12px 16px',
    borderRadius: '18px',
    borderBottomLeftRadius: '4px',
    maxWidth: '85%',
    marginRight: 'auto',
    fontSize: fontSize,
    lineHeight: 1.6,
    fontFamily: "'K2D', sans-serif",
    // boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    direction: textDirection,
    textAlign: textDirection === "rtl" ? "right" : "left" as const,
    transform: 'translateZ(0)',
    willChange: 'transform',
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
  sidebarPopup: {
    position: 'fixed' as const,
    right: 10,
    top: 10,
    bottom: 10,
    width: '500px',
    background: THEME_COLORS[theme].background,
    border: `1px solid ${THEME_COLORS[theme].border}`,
    borderLeft: `1px solid ${THEME_COLORS[theme].border}`,
    boxShadow: "-2px 0 20px rgba(0,0,0,0.15)",
    padding: 20,
    fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'auto',
    fontSize: fontSize,
    zIndex: 3147483645,
    borderRadius: 12,
    minWidth: "400px",
    maxWidth: "800px",
    resize: "horizontal" as const,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: '15px',
      height: '15px',
      cursor: 'se-resize',
      background: 'transparent'
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: '15px',
      height: '15px',
      cursor: 'sw-resize',
      background: 'transparent'
    }
  },
  followUpInputContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
    width: "100%",
    position: 'sticky' as const,
    bottom: 0,
    zIndex: 10,
    padding: '8px 0',
  },
});

export const styles = getStyles("light"); // Default theme