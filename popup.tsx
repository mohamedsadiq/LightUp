import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"

type Mode = "explain" | "summarize"

function IndexPopup() {
  const [activeMode, setActiveMode] = useState<Mode>("explain")
  const storage = new Storage()

  useEffect(() => {
    const loadSavedMode = async () => {
      const savedMode = await storage.get("mode") as Mode
      if (savedMode) {
        setActiveMode(savedMode)
      }
    }
    loadSavedMode()
  }, [])

  const handleModeChange = async (mode: Mode) => {
    setActiveMode(mode)
    await storage.set("mode", mode)
  }

  const styles = {
    container: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "300px",
      fontFamily: "'K2D', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    title: {
      marginBottom: 16,
      fontFamily: "'K2D', sans-serif",
      fontSize: "20px",
      fontWeight: 500
    },
    buttonContainer: {
      display: "flex",
      gap: "8px"
    },
    button: (mode: Mode) => ({
      padding: "8px 16px",
      margin: "4px",
      backgroundColor: activeMode === mode ? "#4CAF50" : "#f0f0f0",
      color: activeMode === mode ? "white" : "black",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "all 0.3s ease",
      fontFamily: "'K2D', sans-serif",
      fontSize: "14px"
    }),
    statusText: {
      marginTop: 16,
      fontSize: "14px",
      color: "#666",
      fontFamily: "'K2D', sans-serif"
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Text Assistant Mode</h2>
      
      <div style={styles.buttonContainer}>
        <button
          onClick={() => handleModeChange("explain")}
          style={styles.button("explain")}>
          Explain
        </button>
        <button
          onClick={() => handleModeChange("summarize")}
          style={styles.button("summarize")}>
          Summarize
        </button>
      </div>

      <p style={styles.statusText}>
        Current mode: <strong>{activeMode}</strong>
      </p>
    </div>
  )
}

export default IndexPopup
