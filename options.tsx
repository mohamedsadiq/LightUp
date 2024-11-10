import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import "./options.css"

// Add the Logo component
const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_171_147)">
      <circle cx="101.067" cy="101.227" r="32.1546" fill="black"/>
      <circle cx="101.067" cy="101.227" r="31.5012" stroke="#A72D20" stroke-width="1.30683"/>
    </g>
    <g filter="url(#filter1_d_171_147)">
      <ellipse cx="101.782" cy="101.42" rx="29.7391" ry="30.2609" fill="black"/>
    </g>
    <defs>
      <filter id="filter0_d_171_147" x="0.772979" y="0.061912" width="200.587" height="200.588" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feMorphology radius="11.4783" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_171_147"/>
        <feOffset dy="-0.871223"/>
        <feGaussianBlur stdDeviation="28.3304"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
      </filter>
      <filter id="filter1_d_171_147" x="52.8761" y="51.9923" width="97.8123" height="98.8553" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feFlood flood-opacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset/>
        <feGaussianBlur stdDeviation="9.58345"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
      </filter>
    </defs>
  </svg>
)

function IndexOptions() {
  const storage = useRef(new Storage()).current;
  const [settings, setSettings] = useState({
    modelType: "",
    serverUrl: "",
    apiKey: ""
  });

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await storage.get("settings") || {};
      setSettings(prev => ({
        ...prev,
        ...savedSettings
      }));
    };

    loadSettings();
  }, []);

  // Add validation before saving
  const handleSave = async () => {
    try {
      // Validate settings
      if (settings.modelType === "local") {
        if (!settings.serverUrl) {
          throw new Error("Server URL is required for local LLM");
        }
        // Validate server URL format
        if (!settings.serverUrl.startsWith("http://127.0.0.1:") && 
            !settings.serverUrl.startsWith("http://localhost:")) {
          throw new Error("Invalid server URL format");
        }
      } else if (settings.modelType === "openai") {
        if (!settings.apiKey) {
          throw new Error("API key is required for OpenAI");
        }
      }

      // Save settings
      await storage.set("settings", settings);
      
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert(error.message || "Failed to save settings");
    }
  };

  // Add a helper function to set server URL
  const handleServerUrlChange = (e) => {
    let url = e.target.value;
    // Ensure the URL starts with http://127.0.0.1:
    if (url && !url.startsWith("http://")) {
      url = `http://${url}`;
    }
    setSettings(prev => ({
      ...prev,
      serverUrl: url
    }));
  };

  return (
    <div style={{
      padding: "20px",
      maxWidth: "600px",
      margin: "0 auto",
      fontFamily: "'K2D', sans-serif",
      backgroundColor: "#ffffff",
      color: "#333333",
      minHeight: "100vh",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "24px"
      }}>
        <Logo />
        <h1 style={{ 
          color: "#333333",
          fontSize: "24px",
          margin: 0,
          fontFamily: "'K2D', sans-serif",
          fontWeight: "600"
        }}>LightUp Settings</h1>
      </div>
      
      <div style={{ marginBottom: "20px" }}>
        <label style={{ 
          display: "block", 
          marginBottom: "8px",
          color: "#333333",
          fontFamily: "'K2D', sans-serif",
          fontWeight: "500"
        }}>
          Model Type:
        </label>
        <select 
          value={settings.modelType}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            modelType: e.target.value
          }))}
          style={{
            width: "100%",
            padding: "8px",
            marginBottom: "16px",
            borderRadius: "4px",
            border: "1px solid #e0e0e0",
            backgroundColor: "#ffffff",
            color: "#333333",
            fontFamily: "'K2D', sans-serif"
          }}
        >
          <option value="local">Local LLM</option>
          <option value="openai">OpenAI</option>
        </select>

        {settings.modelType === "local" ? (
          <>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              color: "#333333",
              fontFamily: "'K2D', sans-serif",
              fontWeight: "500"
            }}>
              Llama Server URL:
            </label>
            <input
              type="text"
              value={settings.serverUrl}
              onChange={handleServerUrlChange}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "8px",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
                backgroundColor: "#ffffff",
                color: "#333333",
                fontFamily: "'K2D', sans-serif"
              }}
              placeholder="http://127.0.0.1:1234"
            />
          </>
        ) : (
          <>
            <label style={{ display: "block", marginBottom: "8px", fontFamily: "'K2D', sans-serif", fontWeight: "500" }}>
              OpenAI API Key:
            </label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                apiKey: e.target.value
              }))}
              style={{
                width: "100%",
                padding: "8px",
                marginBottom: "8px",
                borderRadius: "4px",
                border: "1px solid #e0e0e0",
                backgroundColor: "#ffffff",
                color: "#333333",
                fontFamily: "'K2D', sans-serif"
              }}
              placeholder="Enter your OpenAI API key"
            />
          </>
        )}

        <button
          onClick={handleSave}
          style={{
            padding: "8px 16px",
            backgroundColor: "#10a37f",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "500",
            transition: "background-color 0.2s",
            fontFamily: "'K2D', sans-serif"
          }}
        >
          Save Settings
        </button>
      </div>

      {settings.modelType === "local" && (
        <div style={{ 
          marginTop: "20px",
          backgroundColor: "#f8f8f8",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          fontFamily: "'K2D', sans-serif"
        }}>
          <h2 style={{
            fontSize: "18px",
            marginBottom: "12px",
            fontFamily: "'K2D', sans-serif",
            fontWeight: "600"
          }}>
            How to find your Llama server URL:
          </h2>
          <ol style={{ 
            lineHeight: "1.6",
            paddingLeft: "20px",
            fontFamily: "'K2D', sans-serif"
          }}>
            <li>If you're running Llama locally, the URL is typically <code>http://localhost:PORT</code></li>
            <li>The default port depends on your setup:
              <ul>
                <li>llama.cpp server: Usually port 8080</li>
                <li>LM Studio: Default port 1234</li>
                <li>Text Generation WebUI: Default port 7860</li>
              </ul>
            </li>
            <li>Make sure your Llama server is running before using the extension</li>
          </ol>
        </div>
      )}
    </div>
  )
}

export default IndexOptions