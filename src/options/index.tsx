import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import "./options-style.css"
import type { Settings, ModelType, GeminiModel, GrokModel, LocalModel } from "~types/settings"
import { motion, AnimatePresence } from "framer-motion"
import { useRateLimit } from "~hooks/useRateLimit"
import ErrorMessage from "~components/common/ErrorMessage"

const GEMINI_MODELS: { value: GeminiModel; label: string; description: string }[] = [
  {
    value: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    description: "Latest version with improved capabilities and faster response times"
  },
  {
    value: "gemini-2.0-flash-lite-preview-02-05",
    label: "Gemini 2.0 Flash-Lite",
    description: "Lightweight version optimized for efficiency and speed"
  },
  {
    value: "gemini-2.0-flash-thinking-exp-01-21",
    label: "Gemini 2.0 Flash Thinking",
    description: "Experimental model focused on reasoning and analytical tasks"
  },
  {
    value: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    description: "Stable version with balanced performance"
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

// Add RateLimitDisplay component
const RateLimitDisplay = () => {
  const { remainingActions, isLoading, error } = useRateLimit()
  
  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Loading usage info...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Daily Usage</h3>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">Actions Remaining Today</span>
        <span className="text-lg font-medium">
          {remainingActions} / 20
        </span>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#10a37f] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${(remainingActions / 20) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}

// Add new components for better organization
const SettingsCard = ({ title, icon, children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
    <div className="p-6 border-b border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        {icon}
        {title}
      </h2>
    </div>
    <div className="p-6 space-y-6">
      {children}
    </div>
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };

  return (
    <span className={`${variants[variant]} text-xs font-medium px-2.5 py-0.5 rounded-full ${className}`}>
      {children}
    </span>
  );
};

const ModelOption = ({ model, selected, onChange, showPrice = false, showSize = false }) => (
  <div
    className={`relative flex items-center p-4 rounded-lg border ${
      selected
        ? 'border-[#10a37f] bg-[#10a37f]/5'
        : 'border-gray-200 hover:border-gray-300'
    } cursor-pointer transition-all duration-200`}
    onClick={onChange}
  >
    <div className="flex items-center h-5">
      <input
        type="radio"
        checked={selected}
        onChange={() => {}}
        className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f]"
      />
    </div>
    <div className="ml-4 flex-1">
      <div className="flex justify-between items-start">
        <label className="font-medium text-gray-900">
          {model.label}
        </label>
        {showPrice && <span className="text-sm text-gray-500">{model.price}</span>}
        {showSize && <span className="text-sm text-gray-500">{model.size}</span>}
      </div>
      <p className="text-sm text-gray-500">
        {model.description}
      </p>
    </div>
  </div>
);

function IndexOptions() {
  const storage = useRef(new Storage()).current;
  const [settings, setSettings] = useState<Settings>({
    modelType: "basic",
    maxTokens: 2048,
    apiKey: "",
    geminiApiKey: "",
    geminiModel: "gemini-1.5-pro",
    xaiApiKey: "",
    grokModel: "grok-2",
    localModel: "llama-2-70b-chat",
    basicModel: "gemini-2.0-flash-lite-preview-02-05",
    customization: {
      showSelectedText: false,
      theme: "light",
      radicallyFocus: false,
      fontSize: "1rem",
      highlightColor: "default",
      popupAnimation: "scale",
      persistHighlight: false,
      layoutMode: "floating"
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
              persistHighlight: savedSettings.customization?.persistHighlight ?? false,
              layoutMode: savedSettings.customization?.layoutMode ?? "floating"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[800px] mx-auto p-5 pb-24">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 m-0">
                LightUp Settings
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Configure your AI assistant preferences
              </p>
            </div>
          </div>
          <Badge variant="success">v0.1.5</Badge>
        </motion.div>

        <div className="grid gap-8">
          {/* Model Configuration */}
          <SettingsCard 
            title="Model Configuration" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          >
            <div className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-800 font-medium text-base">
                  Model Type
                </label>
                <select 
                  value={settings.modelType}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    modelType: e.target.value as ModelType
                  }))}
                  className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium transition-colors duration-200 hover:border-[#10a37f] focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20"
                >
                  <option value="basic">LightUp Basic (Free)</option>
                  <option value="local">Local LLM</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="xai">xAI (Grok)</option>
                </select>
              </div>

              {settings.modelType === "basic" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-gradient-to-br from-[#10a37f]/5 to-[#10a37f]/10 p-6 rounded-xl border border-[#10a37f]/20"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-[#10a37f] rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">LightUp Basic</h3>
                      <p className="text-sm text-gray-600">Free tier with basic features</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-[#10a37f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>20 requests per day</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-[#10a37f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Powered by Gemini 2.0</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Not for sensitive data</span>
                    </div>
                  </div>

                  <RateLimitDisplay />
                </motion.div>
              )}

              {settings.modelType === "local" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block mb-2 text-gray-800 font-medium text-base">
                      Llama Server URL
                    </label>
                    <input
                      type="text"
                      value={settings.serverUrl}
                      onChange={handleServerUrlChange}
                      className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium transition-colors duration-200 hover:border-[#10a37f] focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20"
                      placeholder="http://127.0.0.1:1234"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Local LLM server setup. No API key required.
                    </p>
                  </div>

                  <div>
                    <label className="block mb-4 text-gray-800 font-medium text-base">
                      Local Model
                    </label>
                    <div className="grid gap-3">
                      {LOCAL_MODELS.map((model) => (
                        <ModelOption
                          key={model.value}
                          model={model}
                          selected={settings.localModel === model.value}
                          onChange={() => setSettings(prev => ({ ...prev, localModel: model.value }))}
                          showSize
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {settings.modelType === "gemini" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block mb-2 text-gray-800 font-medium text-base">
                      Google Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.geminiApiKey}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          geminiApiKey: e.target.value
                        }))}
                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium transition-colors duration-200 hover:border-[#10a37f] focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20"
                        placeholder="Enter your Gemini API key"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-gray-500">
                        Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-4 text-gray-800 font-medium text-base">
                      Gemini Model
                    </label>
                    <div className="grid gap-3">
                      {GEMINI_MODELS.map((model) => (
                        <ModelOption
                          key={model.value}
                          model={model}
                          selected={settings.geminiModel === model.value}
                          onChange={() => setSettings(prev => ({ ...prev, geminiModel: model.value }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Free Tier Available</h4>
                        <p className="text-sm text-blue-700 mt-0.5">
                          Google Gemini offers a generous free tier with up to 60 requests per minute.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {settings.modelType === "xai" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block mb-2 text-gray-800 font-medium text-base">
                      xAI API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={settings.xaiApiKey}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          xaiApiKey: e.target.value
                        }))}
                        className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium transition-colors duration-200 hover:border-[#10a37f] focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20"
                        placeholder="Enter your xAI API key"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-gray-500">
                        Get your API key from the <a href="https://x.ai/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">xAI platform</a>
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-4 text-gray-800 font-medium text-base">
                      Grok Model
                    </label>
                    <div className="grid gap-3">
                      {GROK_MODELS.map((model) => (
                        <ModelOption
                          key={model.value}
                          model={model}
                          selected={settings.grokModel === model.value}
                          onChange={() => setSettings(prev => ({ ...prev, grokModel: model.value }))}
                          showPrice
                        />
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900">Beta Access</h4>
                        <p className="text-sm text-blue-700 mt-0.5">
                          xAI offers $25 in free credits for beta users. Sign up on their platform to get started.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Max Tokens Input */}
              <div>
                <label className="block mb-2 text-gray-800 font-medium text-base">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    maxTokens: parseInt(e.target.value) || 1000
                  }))}
                  className="w-full p-3 rounded-lg border border-gray-200 bg-white text-gray-800 font-medium transition-colors duration-200 hover:border-[#10a37f] focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20"
                  placeholder="1000"
                  min="1"
                  max="4096"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Maximum number of tokens to generate in each response
                </p>
              </div>

            </div>
          </SettingsCard>

          {/* Customization */}
          <SettingsCard 
            title="Customization" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            }
          >
            <div className="grid gap-6">
              {/* Layout Mode Selection */}
              <div className="space-y-2">
                <label className="block text-gray-800 font-medium text-base">Layout Mode</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'floating', label: 'Floating', icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
                        <circle cx="12" cy="12" r="1"/>
                        <circle cx="12" cy="8" r="1"/>
                        <circle cx="12" cy="16" r="1"/>
                      </svg>
                    )},
                    { value: 'sidebar', label: 'Sidebar', icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <line x1="15" y1="3" x2="15" y2="21"/>
                      </svg>
                    )},
                    { value: 'centered', label: 'Centered', icon: (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                        <rect x="6" y="8" width="12" height="8" rx="1" ry="1"/>
                      </svg>
                    )}
                  ].map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => handleImmediateSettingUpdate('layoutMode', mode.value)}
                      className={`p-4 rounded-lg border ${
                        settings.customization?.layoutMode === mode.value
                          ? 'border-[#10a37f] bg-[#10a37f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-all duration-200`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        {mode.icon}
                        <span className="text-sm">{mode.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Choose between a floating popup or a fixed sidebar layout
                </p>
              </div>

              <Switch
                id="show-selected-text"
                checked={settings.customization?.showSelectedText ?? true}
                onChange={(e) => handleImmediateSettingUpdate('showSelectedText', e.target.checked)}
                label="Show Selected Text"
                description="Display the text you've selected in the results"
              />

              <Switch
                id="radical-focus"
                checked={settings.customization?.radicallyFocus ?? false}
                onChange={(e) => handleImmediateSettingUpdate('radicallyFocus', e.target.checked)}
                label="Radical Focus Mode"
                description="Blur background when viewing results"
              />

              <Switch
                id="persistent-highlight"
                checked={settings.customization?.persistHighlight ?? false}
                onChange={(e) => handleImmediateSettingUpdate('persistHighlight', e.target.checked)}
                label="Persistent Highlighting"
                description="Keep text highlighted after selection"
              />

              {/* Font Size Selection */}
              <div className="space-y-2">
                <label className="block text-gray-800 font-medium text-base">Font Size</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '0.8rem', label: 'Small' },
                    { value: '0.9rem', label: 'Medium' },
                    { value: '1rem', label: 'Large' }
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleImmediateSettingUpdate('fontSize', size.value)}
                      className={`p-4 rounded-lg border ${
                        settings.customization?.fontSize === size.value
                          ? 'border-[#10a37f] bg-[#10a37f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-all duration-200`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className={`text-gray-600`} style={{ fontSize: size.value }}>Aa</span>
                        <span className="text-sm">{size.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selection */}
              <div className="space-y-2">
                <label className="block text-gray-800 font-medium text-base">Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {['light', 'dark'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => handleImmediateSettingUpdate('theme', theme)}
                      className={`p-4 rounded-lg border ${
                        settings.customization?.theme === theme
                          ? 'border-[#10a37f] bg-[#10a37f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-all duration-200`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          {theme === 'light' ? (
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                          ) : (
                            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                          )}
                        </svg>
                        <span className="capitalize">{theme}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <label className="block text-gray-800 font-medium text-base">Highlight Color</label>
                <div className="grid grid-cols-3 gap-3">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleImmediateSettingUpdate('highlightColor', option.value)}
                      className={`p-4 rounded-lg border ${
                        settings.customization?.highlightColor === option.value
                          ? 'border-[#10a37f] bg-[#10a37f]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      } transition-all duration-200`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${option.color}`} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SettingsCard>

          {/* Context Settings Card */}
          <SettingsCard 
            title="Context Settings" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#10a37f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
          >
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 mb-4 text-gray-400">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Coming Soon!</h3>
              <p className="text-gray-500 max-w-sm">
                We're working on bringing you smart context awareness features to enhance your LightUp experience.
              </p>
              <Badge variant="info" className="mt-4">Beta</Badge>
            </div>
          </SettingsCard>
        </div>
      </div>

      {/* Fixed Save Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-lg py-4">
          <div className="max-w-[800px] mx-auto px-5">
            <div className="flex items-center gap-4">
              {error && <ErrorMessage message={error} />}
              
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 h-12 bg-[#10a37f] text-white rounded-xl font-medium transition-all duration-200 hover:bg-[#0d8c6d] hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Save Settings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toast */}
      <div id="toast" className="fixed bottom-4 right-4 bg-[#10a37f] text-white px-4 py-2 rounded-lg opacity-0 transition-opacity duration-300 shadow-lg" />
    </div>
  );
}

export default IndexOptions;