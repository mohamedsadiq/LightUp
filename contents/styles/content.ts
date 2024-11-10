export const styles = {
  popup: {
    width: "300px",
    height: "auto",
    position: "fixed",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
    zIndex: 999999,
    fontFamily: "'K2D', sans-serif",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 16px",
    borderBottom: "1px solid #f0f0f0"
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#1a1a1a"
  },
  actions: {
    display: "flex",
    gap: "12px"
  },
  iconButton: {
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f5f5f5"
    }
  },
  content: {
    padding: "16px",
    maxHeight: "400px",
    overflowY: "auto"
  },
  answer: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#333333",
    whiteSpace: "pre-wrap"
  },
  followUpSection: {
    marginTop: "16px",
    borderTop: "1px solid #f0f0f0",
    padding: "16px"
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    fontSize: "14px",
    "&:focus": {
      outline: "none",
      borderColor: "#2563eb"
    }
  },
  followUpList: {
    marginTop: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  followUpItem: {
    padding: "12px",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: "#f0f1f2"
    }
  },
  followUpQuestion: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#1a1a1a",
    marginBottom: "8px"
  },
  followUpAnswer: {
    fontSize: "14px",
    color: "#4a5568"
  },
  error: {
    color: "#dc2626",
    fontSize: "14px",
    marginTop: "8px"
  }
} as const 