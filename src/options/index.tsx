import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import "../styles/options.css"
import "../style.css"
import type { Settings, GeminiModel } from "~types/settings"

const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: "gemini-pro",
    label: "Gemini Pro",
    description: "Standard text model with balanced performance"
  },
  {
    value: "gemini-pro-vision",
    label: "Gemini Pro Vision",
    description: "Handles both text and image inputs"
  },
  {
    value: "gemini-1.0-pro",
    label: "Gemini 1.0 Pro",
    description: "First version of the model"
  },
  {
    value: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    description: "Latest version with improved capabilities"
  },
  {
    value: "gemini-1.5-flash-8b",
    label: "Gemini 1.5 Flash",
    description: "Faster, smaller model for quick responses"
  }
];

// Add the Logo component
const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_171_147)">
      <circle cx="101.067" cy="101.227" r="32.1546" fill="black"/>
      <circle cx="101.067" cy="101.227" r="31.5012" stroke="#A72D20" strokeWidth="1.30683"/>
    </g>
    <g filter="url(#filter1_d_171_147)">
      <ellipse cx="101.782" cy="101.42" rx="29.7391" ry="30.2609" fill="black"/>
    </g>
    <defs>
      <filter id="filter0_d_171_147" x="0.772979" y="0.061912" width="200.587" height="200.588" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feMorphology radius="11.4783" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_171_147"/>
        <feOffset dy="-0.871223"/>
        <feGaussianBlur stdDeviation="28.3304"/>
        <feComposite in2="hardAlpha" operator="out"/>
        <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.670326 0 0 0 0 0.159863 0 0 0 1 0"/>
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_171_147"/>
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_171_147" result="shape"/>
      </filter>
      <filter id="filter1_d_171_147" x="52.8761" y="51.9923" width="97.8123" height="98.8553" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
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
  const [settings, setSettings] = useState<Settings>({
    modelType: "openai",
    maxTokens: 2048,
    customization: {
      showSelectedText: true
    }
  });

  // Add error state
  const [error, setError] = useState("");

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await storage.get("settings");
      if (savedSettings) {
        // Ensure customization settings are preserved
        setSettings({
          ...savedSettings,
          customization: {
            ...savedSettings.customization,
            showSelectedText: savedSettings.customization?.showSelectedText ?? true
          }
        });
      }
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
      } else if (settings.modelType === "gemini") {
        if (!settings.geminiApiKey) {
          throw new Error("API key is required for Google Gemini");
        }
      }

      // Ensure customization settings are included
      const settingsToSave = {
        ...settings,
        customization: {
          ...settings.customization,
          showSelectedText: settings.customization?.showSelectedText ?? true
        }
      };

      // Save settings with await and proper error handling
      await storage.set("settings", settingsToSave).catch(err => {
        throw new Error(`Storage error: ${err.message}`);
      });
      
      setError(""); // Clear any previous errors
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      setError(error.message || "Failed to save settings");
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
    <div className="p-5 max-w-[600px] mx-auto font-k2d bg-white text-gray-800 min-h-screen rounded-lg shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Logo />
        <h1 className="text-gray-800 text-2xl m-0 font-k2d font-semibold">
          LightUp Settings
        </h1>
      </div>
      
      <div className="mb-5">
        <label className="block mb-2 text-gray-800 font-k2d font-medium">
          Model Type:
        </label>
        <select 
          value={settings.modelType}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            modelType: e.target.value
          }))}
          className="w-full p-2 mb-4 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
        >
          <option value="local">Local LLM</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
        </select>

        {settings.modelType === "local" ? (
          <>
            <label className="block mb-2 text-gray-800 font-k2d font-medium">
              Llama Server URL:
            </label>
            <input
              type="text"
              value={settings.serverUrl}
              onChange={handleServerUrlChange}
              className="w-full p-2 mb-2 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
              placeholder="http://127.0.0.1:1234"
            />
          </>
        ) : settings.modelType === "openai" ? (
          <>
            <label className="block mb-2 font-k2d font-medium">
              OpenAI API Key:
            </label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                apiKey: e.target.value
              }))}
              className="w-full p-2 mb-2 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
              placeholder="Enter your OpenAI API key"
            />
          </>
        ) : (
          <>
            <label className="block mb-2 font-k2d font-medium">
              Google Gemini API Key:
            </label>
            <input
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                geminiApiKey: e.target.value
              }))}
              className="w-full p-2 mb-2 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
              placeholder="Enter your Gemini API key"
            />

            {/* Add Gemini Model Selector */}
            <label className="block mb-2 font-k2d font-medium">
              Gemini Model:
            </label>
            <select
              value={settings.geminiModel || "gemini-pro"}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                geminiModel: e.target.value as GeminiModel
              }))}
              className="w-full p-2 mb-4 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
            >
              {GEMINI_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mb-4">
              {GEMINI_MODELS.find(m => m.value === (settings.geminiModel || "gemini-pro"))?.description}
            </p>
          </>
        )}

        <label className="block mb-2 text-gray-800 font-k2d font-medium">
          Max Tokens:
        </label>
        <input
          type="number"
          value={settings.maxTokens}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            maxTokens: parseInt(e.target.value) || 1000
          }))}
          className="w-full p-2 mb-4 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
          placeholder="1000"
          min="1"
          max="4096"
        />

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#10a37f] text-white border-none rounded cursor-pointer font-medium transition-colors duration-200 font-k2d hover:bg-[#0d8c6d]"
        >
          Save Settings
        </button>
      </div>

      {settings.modelType === "local" && (
        <div className="mt-5 bg-gray-50 p-4 rounded-lg border border-gray-200 font-k2d">
          <h2 className="text-lg mb-3 font-k2d font-semibold">
            How to find your Llama server URL:
          </h2>
          <ol className="leading-relaxed pl-5 font-k2d">
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

      {/* Add Customization Section */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold mb-4">Customization</h2>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showSelectedText"
            checked={settings.customization?.showSelectedText ?? true}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              customization: {
                ...prev.customization,
                showSelectedText: e.target.checked
              }
            }))}
            className="w-4 h-4 rounded border-gray-300"
          />
          <label htmlFor="showSelectedText" className="text-sm">
            Show selected text in popup
          </label>
        </div>
      </div>
    </div>
  )
}

export default IndexOptions