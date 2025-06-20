import { THEME_COLORS, Z_INDEX } from "~utils/constants";

// Font size mapping type - now exported for use in other files
export interface FontSizes {
  base: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  button: string;
  input: string;
  loading: string;
  model: string;
  icon: string;
  welcome: {
    emoji: string;
    heading: string;
    description: string;
  };
  connection: string;
  error: string;
}

export const getStyles = (
  theme: "light" | "dark", 
  textDirection: "ltr" | "rtl" = "ltr", 
  fontSizes: FontSizes
) => ({
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
    // maxHeight: "400px",
    overflow: "auto",
    fontSize: fontSizes.base,
    paddingTop: 0,
    paddingBottom: 0
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
    marginBottom: 23,
    paddingTop: 18
  },
  button: {
    width: 19,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 4,
    fontFamily: "'K2D', sans-serif",
    fontSize: fontSizes.button
  },
  text: {
    fontSize: fontSizes.base,
    lineHeight: 1.5,
    margin: "0 0 16px 0",
    color: THEME_COLORS[theme].text,
    fontFamily: "'K2D', sans-serif"
  },
  explanation: {
    fontSize: fontSizes.base,
    lineHeight: 1.6,
    color: THEME_COLORS[theme].text,
    backgroundColor: THEME_COLORS[theme].popupBackground,
    padding: "5px 9px",
    borderRadius: 8,
    fontFamily: "'K2D', sans-serif",
    direction: textDirection,
    textAlign: textDirection === "rtl" ? "right" : "left" as const,
    paddingTop: 13
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
    fontSize: fontSizes.error,
    marginTop: 8,
    fontFamily: "'K2D', sans-serif"
  },
  loadingText: {
    fontFamily: "'K2D', sans-serif",
    fontSize: fontSizes.loading,
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
    padding: "11px 14px",
    borderRadius: "31px",
    border: theme === "light" ? "1px solid #dedede" : "1px solid rgb(84 84 84)",
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
    fontSize: fontSizes.button,
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
    fontSize: fontSizes.input,
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
    fontSize: fontSizes.base,
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
    fontSize: fontSizes.base,
    lineHeight: 1.6,
    fontFamily: "'K2D', sans-serif",
    direction: textDirection,
    textAlign: textDirection === "rtl" ? "right" : "left" as const,
    transform: 'translateZ(0)',
    willChange: 'transform',
    overflow: 'scroll'
  },
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
    paddingBottom: 0,
    paddingTop: 0,
    fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'auto',
    fontSize: fontSizes.base,
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
  centeredPopup: {
    position: 'relative' as const,
    width: '700px',
    background: THEME_COLORS[theme].background,
    border: `1px solid ${THEME_COLORS[theme].border}`,
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    padding: '0 25px',
    fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: 'auto',
    fontSize: fontSizes.base,
    zIndex: Z_INDEX.CENTERED_POPUP,
    borderRadius: 12,
    minWidth: "600px",
    maxWidth: "80%",
    minHeight: "400px", 
    maxHeight: "80vh",
    margin: 0,
    resize: "both" as const,
  },
  centeredPopupOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: Z_INDEX.POPUP_OVERLAY,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 0,
    padding: 0,
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

// Create a default fontSizes object for backward compatibility
const createDefaultFontSizes = (fontSize: string = "16px"): FontSizes => {
  const parseSize = (size: string): number => {
    const match = size.match(/^([\d.]+)px$/);
    return match ? parseFloat(match[1]) : 16;
  };

  const baseSize = parseSize(fontSize);
  
  return {
    base: `${baseSize}px`,
    xs: `${Math.max(10, Math.round(baseSize * 0.75))}px`,
    sm: `${Math.max(11, Math.round(baseSize * 0.85))}px`,
    md: `${baseSize}px`,
    lg: `${Math.round(baseSize * 1.15)}px`,
    xl: `${Math.round(baseSize * 1.3)}px`,
    xxl: `${Math.round(baseSize * 1.5)}px`,
    button: `${Math.max(13, Math.round(baseSize * 0.9))}px`,
    input: `${Math.max(13, Math.round(baseSize * 0.9))}px`,
    loading: `${Math.max(12, Math.round(baseSize * 0.8))}px`,
    model: `${Math.max(11, Math.round(baseSize * 0.75))}px`,
    icon: `${Math.max(11, Math.round(baseSize * 0.7))}px`,
    welcome: {
      emoji: `${Math.round(baseSize * 1.8)}px`,
      heading: `${Math.round(baseSize * 1.2)}px`,
      description: `${Math.max(13, Math.round(baseSize * 0.9))}px`
    },
    connection: `${Math.max(11, Math.round(baseSize * 0.75))}px`,
    error: `${Math.max(13, Math.round(baseSize * 0.85))}px`
  };
};

export const styles = getStyles("light", "ltr", createDefaultFontSizes()); // Default theme