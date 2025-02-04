import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import "../styles/options.css"
import "../style.css"
import type { Settings, ModelType, GeminiModel, GrokModel, LocalModel } from "~types/settings"
import { motion, AnimatePresence } from "framer-motion"

const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    description: "Latest version with improved capabilities"
  },
  {
    value: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    description: "Faster, smaller model for quick responses"
  },
  {
    value: "gemini-1.5-flash-8b",
    label: "Gemini 1.5 Flash-8B",
    description: "8-bit quantized version for efficient processing"
  }
];

const GROK_MODELS: { value: GrokModel; label: string; description: string; price: string }[] = [
  {
    value: "grok-2",
    label: "Grok 2",
    description: "Standard text model with balanced performance",
    price: "$2.00 per 1M tokens"
  },
  {
    value: "grok-2-latest",
    label: "Grok 2 Latest",
    description: "Latest version with improved capabilities",
    price: "$2.00 per 1M tokens"
  },
  {
    value: "grok-beta",
    label: "Grok Beta",
    description: "Beta version with experimental features",
    price: "$5.00 per 1M tokens"
  }
];

const LOCAL_MODELS: { value: LocalModel; label: string; description: string; size: string }[] = [
  {
    value: "llama-2-70b-chat",
    label: "Llama 2 70B Chat",
    description: "Most powerful Llama 2 model, best for complex tasks",
    size: "70B parameters"
  },
  {
    value: "deepseek-v3",
    label: "DeepSeek V3",
    description: "Latest DeepSeek model with enhanced reasoning capabilities",
    size: "67B parameters"
  },
  {
    value: "mixtral-8x7b-instruct",
    label: "Mixtral 8x7B Instruct",
    description: "High-performance mixture of experts model",
    size: "47B parameters"
  },
  {
    value: "llama-2-13b-chat",
    label: "Llama 2 13B Chat",
    description: "Balanced performance and resource usage",
    size: "13B parameters"
  },
  {
    value: "mistral-7b-instruct",
    label: "Mistral 7B Instruct",
    description: "Efficient instruction-following model",
    size: "7B parameters"
  },
  {
    value: "neural-chat-7b-v3-1",
    label: "Neural Chat V3.1",
    description: "Optimized for natural conversations",
    size: "7B parameters"
  },
  {
    value: "deepseek-v3-base",
    label: "DeepSeek V3 Base",
    description: "Lighter version of DeepSeek with good reasoning",
    size: "7B parameters"
  },
  {
    value: "llama-3.2-3b-instruct",
    label: "Llama 3.2 3B Instruct",
    description: "Lightweight model for basic tasks",
    size: "3B parameters"
  },
  {
    value: "phi-2",
    label: "Phi-2",
    description: "Compact but powerful for its size",
    size: "2.7B parameters"
  },
  {
    value: "openchat-3.5",
    label: "OpenChat 3.5",
    description: "Optimized for chat interactions",
    size: "7B parameters"
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


// Add this before the IndexOptions function
const Switch = ({ id, checked, onChange, label, description = undefined }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex-1">
      <div className="text-base font-semibold text-gray-900">{label}</div>
      {description && <p className="text-xs font-normal text-gray-500 mt-0.5">{description}</p>}
    </div>
    <div 
      className="relative cursor-pointer" 
      onClick={(e) => {
        e.preventDefault();
        onChange({ target: { checked: !checked } });
      }}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={() => {}}
        className="sr-only peer"
      />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#10a37f]/30 dark:peer-focus:ring-[#10a37f]/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#10a37f]"></div>
    </div>
  </div>
);

function IndexOptions() {
  const storage = useRef(new Storage()).current;
  const [settings, setSettings] = useState<Settings>({
    modelType: "local",
    maxTokens: 2048,
    apiKey: "",
    geminiApiKey: "",
    geminiModel: "gemini-1.5-pro",
    xaiApiKey: "",
    grokModel: "grok-2",
    localModel: "llama-2-70b-chat",
    customization: {
      showSelectedText: true,
      theme: "light",
      radicallyFocus: false,
      fontSize: "1rem",
      highlightColor: "default",
      popupAnimation: "scale",
      persistHighlight: false
    }
  });

  // Add error state
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await storage.get("settings") as Settings | undefined;
        if (savedSettings) {
          setSettings({
            ...savedSettings,
            customization: {
              showSelectedText: savedSettings.customization?.showSelectedText ?? true,
              theme: savedSettings.customization?.theme ?? "light",
              radicallyFocus: savedSettings.customization?.radicallyFocus ?? false,
              fontSize: savedSettings.customization?.fontSize ?? "1rem",
              highlightColor: savedSettings.customization?.highlightColor ?? "default",
              popupAnimation: savedSettings.customization?.popupAnimation ?? "scale",
              persistHighlight: savedSettings.customization?.persistHighlight ?? false
            }
          });
        }
      } catch (err) {
        setError("Failed to load settings");
      }
    };
    loadSettings();
  }, []);

  // Add validation before saving
  const handleSave = async () => {
    try {
      setIsSaving(true);
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
      }
      
      // Ensure customization settings are included
      const settingsToSave = {
        ...settings,
        customization: {
          ...settings.customization,
          showSelectedText: settings.customization?.showSelectedText ?? true,
          theme: settings.customization?.theme ?? "light",
          radicallyFocus: settings.customization?.radicallyFocus ?? false,
          fontSize: settings.customization?.fontSize ?? "1rem",
          highlightColor: settings.customization?.highlightColor ?? "default",
          popupAnimation: settings.customization?.popupAnimation ?? "scale",
          persistHighlight: settings.customization?.persistHighlight ?? false
        }
      };

      // Save settings
      await storage.set("settings", settingsToSave);
      
      setError(""); // Clear any previous errors
      alert("Settings saved successfully!");
    } catch (error) {
      setError(error.message || "Failed to save settings");
      alert(error.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
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


  const colorOptions = [
    { value: 'default', label: 'Default (System)', color: 'bg-gray-200' },
    { value: 'orange', label: 'Orange', color: 'bg-[#FFBF5A]' },
    { value: 'blue', label: 'Blue', color: 'bg-[#93C5FD]' },
    { value: 'green', label: 'Green', color: 'bg-[#86EFAC]' },
    { value: 'purple', label: 'Purple', color: 'bg-[#C4B5FD]' },
    { value: 'pink', label: 'Pink', color: 'bg-[#FDA4AF]' }
  ];

  // Add a new function to handle immediate settings updates
  const handleImmediateSettingUpdate = async (key: string, value: any) => {
    try {
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          [key]: value
        }
      };
      
      setSettings(newSettings);
      await storage.set("settings", newSettings);
   
    } catch (error) {
    
      setError(`Failed to update ${key}`);
    }
  };

  // Add event listener for success messages
  useEffect(() => {
    const handleSettingUpdated = (event: CustomEvent) => {
      const toast = document.getElementById('toast');
      if (toast) {
        toast.textContent = event.detail.message;
        toast.style.opacity = '1';
        setTimeout(() => {
          toast.style.opacity = '0';
        }, 2000);
      }
    };

    window.addEventListener('settingUpdated', handleSettingUpdated as EventListener);
    return () => {
      window.removeEventListener('settingUpdated', handleSettingUpdated as EventListener);
    };
  }, []);

  return (
    <div className="p-5 pb-24 max-w-[600px] mx-auto font-k2d bg-white text-gray-800 min-h-screen rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Logo />
          <h1 className="text-gray-800 text-2xl m-0 font-k2d font-semibold">
            LightUp Settings
          </h1>
        </div>
       
      </div>

      {/* Configuration Section */}
      <div className="mb-5">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        
        <label className="block mb-2 text-gray-800 font-k2d font-medium text-base">
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
          <option value="gemini">Google Gemini</option>
          <option value="xai">xAI (Grok)</option>
        </select>

        {settings.modelType === "local" ? (
          <>
            <label className="block mb-2 text-gray-800 font-k2d font-medium text-base">
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
              Local LLM server setup. No API key required.
            </p>

            <label className="block mb-2 font-k2d font-medium text-base">
              Local Model:
            </label>
            <div className="grid gap-4">
              {LOCAL_MODELS.map((model) => (
                <div
                  key={model.value}
                  className={`relative flex items-center p-4 rounded-lg border ${
                    settings.localModel === model.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-all duration-200`}
                  onClick={() => setSettings(prev => ({ ...prev, localModel: model.value }))}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      checked={settings.localModel === model.value}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <label className="font-medium text-gray-900">
                        {model.label}
                      </label>
                      <span className="text-sm text-gray-500">
                        {model.size}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : settings.modelType === "gemini" ? (
          <>
            <label className="block mb-2 font-k2d font-medium text-base">
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

            <label className="block mb-2 font-k2d font-medium text-base">
              Gemini Model:
            </label>
            <div className="grid gap-4">
              {GEMINI_MODELS.map((model) => (
                <div
                  key={model.value}
                  className={`relative flex items-center p-4 rounded-lg border ${
                    settings.geminiModel === model.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-all duration-200`}
                  onClick={() => setSettings(prev => ({ ...prev, geminiModel: model.value }))}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      checked={settings.geminiModel === model.value}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]"
                    />
                  </div>
                  <div className="ml-4">
                    <label className="font-medium text-gray-900">
                      {model.label}
                    </label>
                    <p className="text-sm text-gray-500">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <label className="block mb-2 font-k2d font-medium text-base">
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

            <label className="block mb-2 font-k2d font-medium text-base">
              Grok Model:
            </label>
            <div className="grid gap-4">
              {GROK_MODELS.map((model) => (
                <div
                  key={model.value}
                  className={`relative flex items-center p-4 rounded-lg border ${
                    settings.grokModel === model.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } cursor-pointer transition-all duration-200`}
                  onClick={() => setSettings(prev => ({ ...prev, grokModel: model.value }))}
                >
                  <div className="flex items-center h-5">
                    <input
                      type="radio"
                      checked={settings.grokModel === model.value}
                      onChange={() => {}}
                      className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]"
                    />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex justify-between items-start">
                      <label className="font-medium text-gray-900">
                        {model.label}
                      </label>
                      <span className="text-sm text-gray-500">
                        {model.price}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {model.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <label className="block mb-2 text-gray-800 font-k2d font-medium text-base">
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

      {/* Local LLM Instructions */}
      {settings.modelType === "local" && (
        <div className="mt-5 mb-5 bg-gray-50 p-4 rounded-lg border border-gray-200 font-k2d">
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

      {/* Customization Section - Moved to bottom */}
      <div className="mt-8 mb-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              Customization
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Show Selected Text */}
            <div className="mb-4">
              <Switch
                id="show-selected-text"
                checked={settings.customization?.showSelectedText ?? true}
                onChange={(e) => handleImmediateSettingUpdate('showSelectedText', e.target.checked)}
                label="Show Selected Text"
              />
            </div>

            {/* Radical Focus Mode */}
            <div className="mb-4">
              <Switch
                id="radical-focus"
                checked={settings.customization?.radicallyFocus ?? false}
                onChange={(e) => handleImmediateSettingUpdate('radicallyFocus', e.target.checked)}
                label={
                  <div>
                    <span className="font-medium text-gray-900">Radical Focus Mode</span>
                    <p className="text-xs font-normal text-gray-500 mt-0.5">Blur background when viewing results</p>
                  </div>
                }
              />
            </div>

            {/* Popup Animation */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900">Popup Animation</div>
                <p className="text-xs font-normal text-gray-500 mt-0.5">Choose how the popup appears</p>
              </div>
              <select
                value={settings.customization?.popupAnimation ?? "scale"}
                onChange={(e) => handleImmediateSettingUpdate('popupAnimation', e.target.value)}
                className="form-select rounded-lg border-gray-200 bg-white text-gray-800 font-medium px-4 py-2 pr-10 hover:border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
              >
                <option value="scale">Scale Animation</option>
                <option value="fade">Fade Animation</option>
                <option value="none">No Animation</option>
              </select>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                  Theme
                </div>
              </div>
              <select
                value={settings.customization?.theme ?? "light"}
                onChange={(e) => handleImmediateSettingUpdate('theme', e.target.value)}
                className="form-select rounded-lg border-gray-200 bg-white text-gray-800 font-medium px-4 py-2 pr-10 hover:border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Font Size Selector */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  Font Size
                </div>
              </div>
              <select
                value={settings.customization?.fontSize ?? "1rem"}
                onChange={(e) => handleImmediateSettingUpdate('fontSize', e.target.value)}
                className="form-select rounded-lg border-gray-200 bg-white text-gray-800 font-medium px-4 py-2 pr-10 hover:border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
              >
                <option value="0.8rem">Small (0.8rem)</option>
                <option value="0.9rem">Medium (0.9rem)</option>
                <option value="1rem">Large (1rem)</option>
              </select>
            </div>

            {/* Highlight Color Selector */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                  </svg>
                  Highlight Color
                </div>
                <p className="text-sm font-normal text-gray-500 mt-0.5">Color of selected text</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={settings.customization?.highlightColor ?? "default"}
                  onChange={(e) => handleImmediateSettingUpdate('highlightColor', e.target.value)}
                  className="form-select rounded-lg border-gray-200 bg-white text-gray-800 font-medium px-4 py-2 pr-10 hover:border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200"
                >
                  {colorOptions.map(option => (
                    <option key={option.value} value={option.value} className="flex items-center gap-2 py-2">
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className={`w-6 h-6 rounded-full border border-gray-200 transition-all duration-200 ${
                  colorOptions.find(opt => opt.value === settings.customization?.highlightColor)?.color
                }`}></div>
              </div>
            </div>

            {/* Add Persistent Highlight Toggle after the Highlight Color selector */}
            <div className="flex items-center justify-between py-2">
              <div className="flex-1">
                <label className="font-medium text-gray-900 text-base flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 10a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
                  </svg>
                  Persistent Highlighting
                </label>
                <p className="text-sm font-normal text-gray-500 mt-0.5">Keep text highlighted after selection</p>
              </div>
              <div className="flex items-center">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.customization?.persistHighlight ?? false}
                    onChange={(e) => handleImmediateSettingUpdate('persistHighlight', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#10a37f]/30 dark:peer-focus:ring-[#10a37f]/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#10a37f]"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-gray-900">Context Settings</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Beta</span>
            </div>
            <p className="text-sm font-normal text-gray-500 mt-0.5">Coming Soon</p>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-16 h-16 mb-4">
            <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Context Settings are Coming Soon!</h3>
          <p className="text-gray-500 max-w-sm">
            We're working on bringing you smart context awareness features to enhance your LightUp experience. Stay tuned for updates!
          </p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* Backdrop blur and gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white to-transparent h-32 -translate-y-full pointer-events-none" />
        
        {/* Main container */}
        <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-lg py-4">
          <div className="max-w-[600px] mx-auto px-5">
            <div className="flex flex-col gap-3">
              {error && (
                <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-100 animate-shake">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex-1 px-4 h-11 bg-[#10a37f] text-white border-none rounded-xl cursor-pointer font-medium transition-all duration-200 font-k2d hover:bg-[#0d8c6d] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2`}
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h-2v5.586l-1.293-1.293z" />
                        <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm10 0H6v12h8V4z" />
                      </svg>
                      <span>Save Settings</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

     

      <div id="toast" className="fixed bottom-4 right-4 bg-[#10a37f] text-white px-4 py-2 rounded-lg opacity-0 transition-opacity duration-300 shadow-lg"></div>
    </div>
  );
}

export default IndexOptions;