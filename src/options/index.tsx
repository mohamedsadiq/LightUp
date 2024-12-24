import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import "../styles/options.css"
import "../style.css"
import type { Settings, ModelType, GeminiModel } from "~types/settings"
import { motion, AnimatePresence } from "framer-motion"

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

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    alert('Address copied to clipboard!');
  }, (err) => {
    console.error('Could not copy text: ', err);
  });
};

const popupVariants = {
  hidden: { opacity: 0, scale: 0.8, filter: 'blur(10px)' },
  visible: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 0.8, filter: 'blur(10px)' }
};

const CryptoSupportPopup = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <motion.div
            className="bg-white p-8 rounded-lg shadow-lg w-5/6 max-w-lg"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={popupVariants}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-2xl font-bold mb-6 text-center">Support the Project</h2>
            {/* <p className="text-center text-gray-600 mb-4">Your support helps us continue to improve and maintain this project. Thank you for your generosity!</p> */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">BTC Address:</span>
                <span className="text-gray-600">1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</span>
                <button onClick={() => copyToClipboard('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')} className="ml-2 bg-gray-200 text-gray-800 px-2 py-1 rounded">Copy</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">ETH Address:</span>
                <span className="text-gray-600">0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
                <button onClick={() => copyToClipboard('0x742d35Cc6634C0532925a3b844Bc454e4438f44e')} className="ml-2 bg-gray-200 text-gray-800 px-2 py-1 rounded">Copy</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">USDT Address:</span>
                <span className="text-gray-600">T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb</span>
                <button onClick={() => copyToClipboard('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb')} className="ml-2 bg-gray-200 text-gray-800 px-2 py-1 rounded">Copy</button>
              </div>
            </div>
            <button onClick={onClose} className="mt-6 bg-[#000] text-white px-4 py-2 rounded-[7px] w-full">Close</button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

function IndexOptions() {
  const storage = useRef(new Storage()).current;
  const [settings, setSettings] = useState<Settings>({
    modelType: "openai",
    maxTokens: 2048,
    customization: {
      showSelectedText: true,
      theme: "light",
      radicallyFocus: false,
      fontSize: "1rem"
    }
  });

  // Add error state
  const [error, setError] = useState("");

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const savedSettings = await storage.get("settings") as Settings | undefined;
      if (savedSettings) {
        setSettings({
          ...savedSettings,
          customization: {
            showSelectedText: savedSettings.customization?.showSelectedText ?? true,
            theme: savedSettings.customization?.theme ?? "light",
            radicallyFocus: savedSettings.customization?.radicallyFocus ?? false,
            fontSize: savedSettings.customization?.fontSize ?? "1rem"
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
        if (!settings.apiKey.startsWith('sk-')) {
          throw new Error("Invalid OpenAI API key format");
        }
      } else if (settings.modelType === "gemini") {
        if (!settings.geminiApiKey) {
          throw new Error("API key is required for Google Gemini");
        }
      } else if (settings.modelType === "xai") {
        if (!settings.xaiApiKey?.trim()) {
          throw new Error("API key is required for xAI");
        }
        // Log successful validation
        console.log('xAI configuration validated successfully');
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
      
      console.log('Settings saved:', {
        ...settingsToSave,
        apiKey: settingsToSave.apiKey ? '***' : undefined,
        geminiApiKey: settingsToSave.geminiApiKey ? '***' : undefined,
        xaiApiKey: settingsToSave.xaiApiKey ? '***' : undefined
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

  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleSupportClick = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  return (
    <div className="p-5 max-w-[600px] mx-auto font-k2d bg-white text-gray-800 min-h-screen rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-gray-800 text-2xl m-0 font-k2d font-semibold">
            LightUp Settings
          </h1>
        </div>
        <button onClick={handleSupportClick} className="bg-[#f5a435] text-white px-3 py-1 rounded-[5px] flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          Support LightUp
        </button>
      </div>
      
      <div className="mb-5">
        <label className="block mb-2 text-gray-800 font-k2d font-medium">
          Model Type:
        </label>
        <select 
          value={settings.modelType}
          onChange={(e) => setSettings(prev => ({
            ...prev,
            modelType: e.target.value as ModelType
          }))}
          className="w-full p-2 mb-4 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
        >
          <option value="local">Local LLM</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Google Gemini</option>
          <option value="xai">xAI (Grok)</option>
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
            <p className="text-sm text-gray-500 mb-4">
              Llama is a local server setup. No API key is required.
            </p>
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
            <p className="text-sm text-gray-500 mb-4">
              Get your API key from the <a href="https://platform.openai.com/docs/overview" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI platform</a>. Free tier available.
            </p>
          </>
        ) : settings.modelType === "gemini" ? (
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
            <p className="text-sm text-gray-500 mb-4">
              Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>. Free tier available.
            </p>
          </>
        ) : (
          <>
            <label className="block mb-2 font-k2d font-medium">
              xAI API Key:
            </label>
            <input
              type="password"
              value={settings.xaiApiKey}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                xaiApiKey: e.target.value
              }))}
              className="w-full p-2 mb-2 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
              placeholder="Enter your xAI API key"
            />
            <p className="text-sm text-gray-500 mb-4">
              Get your API key from the <a href="https://x.ai/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">xAI platform</a>. Free tier available with $25 monthly credits for beta users.
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
      </div>

      {/* Customization Section */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Customization</h2>
        
        <div className="space-y-4">
          {/* Show Selected Text Toggle */}
          <div className="flex items-center justify-between">
            <label className="font-k2d">Show Selected Text</label>
            <input
              type="checkbox"
              checked={settings.customization?.showSelectedText ?? true}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  customization: {
                    showSelectedText: e.target.checked,
                    theme: prev.customization?.theme ?? "light",
                    radicallyFocus: prev.customization?.radicallyFocus ?? false,
                    fontSize: prev.customization?.fontSize ?? "1rem"
                  }
                }));
              }}
              className="w-4 h-4 text-[#10a37f] rounded focus:ring-[#10a37f] focus:ring-offset-0"
            />
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <label className="font-k2d">Theme</label>
            <select
              value={settings.customization?.theme ?? "light"}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  customization: {
                    showSelectedText: prev.customization?.showSelectedText ?? true,
                    theme: e.target.value as "light" | "dark",
                    radicallyFocus: prev.customization?.radicallyFocus ?? false,
                    fontSize: prev.customization?.fontSize ?? "1rem"
                  }
                }));
              }}
              className="p-2 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Radical Focus Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-k2d">Radical Focus Mode</label>
              <p className="text-xs text-gray-500">Blur background when viewing results</p>
            </div>
            <input
              type="checkbox"
              checked={settings.customization?.radicallyFocus ?? false}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  customization: {
                    showSelectedText: prev.customization?.showSelectedText ?? true,
                    theme: prev.customization?.theme ?? "light",
                    radicallyFocus: e.target.checked,
                    fontSize: prev.customization?.fontSize ?? "1rem"
                  }
                }));
              }}
              className="w-4 h-4 text-[#10a37f] rounded focus:ring-[#10a37f] focus:ring-offset-0"
            />
          </div>

          {/* Font Size Selector */}
          <div className="flex items-center justify-between">
            <label className="font-k2d">Font Size</label>
            <select
              value={settings.customization?.fontSize ?? "1rem"}
              onChange={(e) => {
                setSettings(prev => ({
                  ...prev,
                  customization: {
                    showSelectedText: prev.customization?.showSelectedText ?? true,
                    theme: prev.customization?.theme ?? "light",
                    radicallyFocus: prev.customization?.radicallyFocus ?? false,
                    fontSize: e.target.value as "0.8rem" | "0.9rem" | "1rem"
                  }
                }));
              }}
              className="p-2 rounded border border-gray-200 bg-white text-gray-800 font-k2d"
            >
              <option value="0.8rem">Small (0.8rem)</option>
              <option value="0.9rem">Medium (0.9rem)</option>
              <option value="1rem">Large (1rem)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className="mt-6 px-4 py-2 bg-[#10a37f] text-white border-none rounded-[7px] cursor-pointer font-medium transition-colors duration-200 font-k2d hover:bg-[#0d8c6d] w-full"
      >
        Save Settings
      </button>

      {/* Local LLM Instructions */}
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

      <CryptoSupportPopup isOpen={isPopupOpen} onClose={handleClosePopup} />
    </div>
  );
}

export default IndexOptions;