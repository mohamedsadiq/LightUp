import { color } from "framer-motion"

export const styles = {
  popup: {
    width: "300px",
    height: "auto",
    padding: 20,
    background: "#E9E9E9",
    border: "1px solid #d4d4d4",
    borderRadius: 13,
    boxShadow: "0 2px 20px rgba(0,0,0,0.15)",
    maxWidth: 500,
    fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxHeight: "400px",
    overflow: "auto",
  
  },
  buttonContainer: {
    // display: "flex",
    // justifyContent: "flex-end",
    // gap: 8,
    // position: "absolute" as const,
    // top: 12,
    // right: 12,
    height: "fit-content",
    minHeight: 40,
    zIndex: 9999
  },
  buttonContainerParent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    // padding: "12px",
    // borderBottom: "1px solid rgba(0,0,0,0.1)",
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
    // marginTop: 4
  },
  text: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: "0 0 16px 0",
    color: "#000",
    fontFamily: "'K2D', sans-serif"
  },
  explanation: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#333",
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    fontFamily: "'K2D', sans-serif",
    // willChange: 'transform, opacity',
    // transformOrigin: 'top',
    // whiteSpace: 'pre-wrap',
    // overflow: 'hidden',
    // '& span': {
    //   display: 'inline-block',
    //   willChange: 'transform, opacity'
    // },
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
    color: "#666",
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  searchContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    gap: 8,
    fontFamily: "'K2D', sans-serif",
    backgroundColor: "#2C2C2C",
    padding: "8px 12px",
    borderRadius: "31px",
    alignItems: "center",
  },
  searchSendButton: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    borderRadius: "50%",
    transition: "all 0.2s ease",
    "&:disabled": {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    }
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    border: "none",
    fontSize: 14,
    fontFamily: "'K2D', sans-serif",
    backgroundColor: "transparent",
    color: "white",
    outline: "none",
    "&::placeholder": {
      color: "#666"
    }
  },
  askButton: {
    padding: "8px 16px",
    backgroundColor: "#565656",
    color: "white",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontFamily: "'K2D', sans-serif",
    minWidth: "fit-content",
    borderRadius: "23px",
    "&:hover": {
      opacity: 0.8
    }
  },
  followUpText: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
    fontFamily: "'K2D', sans-serif",
    fontStyle: "italic"
  },
  cursor: {
    display: 'inline-block',
    width: '2px',
    height: '1em',
    backgroundColor: '#333',
    verticalAlign: 'middle',
    marginLeft: '2px',
    animation: 'blink 1s step-end infinite'
  },
  followUpContainer: {
    marginTop: '12px',
    width: '100%',
  },
  followUpQuestion: {
    backgroundColor: '#2C2C2C',
    color: 'white',
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
    backgroundColor: '#f5f5f5',
    color: '#333',
    padding: '8px 12px',
    borderRadius: '18px',
    borderBottomLeftRadius: '4px',
    maxWidth: '85%',
    marginRight: 'auto',
    fontSize: '12px',
    lineHeight: 1.6,
    fontFamily: "'K2D', sans-serif",
    whiteSpace: 'pre-wrap',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  feedbackContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-start',
    marginTop: '8px',
    paddingLeft: '4px',
  },
  feedbackButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease'
  },
  configurationWarning: {
    position: 'fixed' as const,
    bottom: 20,
    right: 20,
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    zIndex: 10000
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
  followUpSection: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    padding: '8px 0',
  },
  
  followUpInputContainer: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
   
    backgroundColor: 'transparent',
    borderRadius: '12px',
  },
  followUpInput: {
    color:"#000",
    flex: 1,
    padding: '8px 12px',
    borderRadius: '20px',
    border: '1px solid #e0e0e0',
    fontSize: '14px',
    fontFamily: "'K2D', sans-serif",
    backgroundColor: 'white',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    '&:focus': {
      borderColor: '#2C2C2C',
    }
  },
  followUpButton: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#2C2C2C',
    color: 'white',
    fontSize: '14px',
    fontFamily: "'K2D', sans-serif",
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    }
  }
} as const

export type Styles = typeof styles 