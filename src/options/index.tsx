import { useEffect, useState, useRef } from "react"
import { Storage } from "@plasmohq/storage"
import "./options-style.css"
import type { Settings, ModelType, GeminiModel, GrokModel, LocalModel, Mode } from "~types/settings"
import { motion, AnimatePresence } from "framer-motion"
import { useRateLimit } from "~hooks/useRateLimit"
import ErrorMessage from "~components/common/ErrorMessage"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../utils/constants"

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
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 pt-0.5">
      <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#10a37f]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10a37f]"></div>
      </label>
    </div>
    <div>
      <label htmlFor={id} className="text-sm font-medium text-gray-800 cursor-pointer">
        {label}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
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
const SettingsCard = ({ id = undefined, title, icon, children, className = "" }) => (
  <div id={id} className={`bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
    <div className="px-4 py-3 border-b border-gray-100">
      <h2 className="text-base font-medium text-gray-800 flex items-center gap-2">
        {icon}
        {title}
      </h2>
    </div>
    <div className="p-4 space-y-4">
      {children}
    </div>
  </div>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-50 text-green-700",
    warning: "bg-yellow-50 text-yellow-700",
    error: "bg-red-50 text-red-700",
    info: "bg-blue-50 text-blue-700"
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

const ModelOption = ({ model, selected, onChange, showPrice = false, showSize = false }) => (
  <div
    className={`relative flex items-center p-3 rounded-lg border ${
      selected
        ? 'border-[#10a37f] bg-[#f0faf7]'
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    } cursor-pointer transition-all duration-150`}
    onClick={onChange}
  >
    <div className="flex items-center h-5">
      <input
        type="radio"
        checked={selected}
        onChange={() => {}}
        className="w-4 h-4 text-[#10a37f] border-gray-300 focus:ring-[#10a37f] focus:ring-2"
      />
    </div>
    <div className="ml-3 flex-1">
      <div className="flex justify-between items-start">
        <label className="text-sm font-medium text-gray-800">
          {model.label}
        </label>
        {showPrice && <span className="text-xs text-gray-500">{model.price}</span>}
        {showSize && <span className="text-xs text-gray-500">{model.size}</span>}
      </div>
      <p className="text-xs text-gray-500 mt-0.5">
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add new state for managing prompt editing
  const [activePromptMode, setActivePromptMode] = useState<Mode>("explain");
  const [isEditingSystemPrompt, setIsEditingSystemPrompt] = useState(false);
  const [isEditingUserPrompt, setIsEditingUserPrompt] = useState(false);
  const [editedSystemPrompt, setEditedSystemPrompt] = useState("");
  const [editedUserPrompt, setEditedUserPrompt] = useState("");

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
              layoutMode: savedSettings.customization?.layoutMode ?? "floating",
              contextAwareness: savedSettings.customization?.contextAwareness ?? false
            }
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
        setError("Failed to load settings");
      }
    };
    
    loadSettings();
  }, []);

  // Add effect to scroll to the prompt-templates section if the URL has that hash
  useEffect(() => {
    // Function to scroll to the element with the given ID
    const scrollToElement = (id: string) => {
      // Add a small delay to ensure the DOM is fully loaded
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          // Scroll to the element with smooth behavior
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    };

    // Check if the URL has a hash
    if (window.location.hash) {
      // Remove the # character
      const id = window.location.hash.substring(1);
      scrollToElement(id);
    }

    // Add event listener for hash changes
    const handleHashChange = () => {
      if (window.location.hash) {
        const id = window.location.hash.substring(1);
        scrollToElement(id);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    // Clean up the event listener
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update the handleSave function to include the customPrompts
  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updatedSettings = {
        ...settings,
        // Include any fields you need to save
        modelType: settings.modelType,
        apiKey: settings.apiKey,
        geminiApiKey: settings.geminiApiKey,
        xaiApiKey: settings.xaiApiKey,
        serverUrl: settings.serverUrl,
        geminiModel: settings.geminiModel,
        grokModel: settings.grokModel,
        localModel: settings.localModel,
        maxTokens: settings.maxTokens,
        preferredModes: settings.preferredModes,
        customPrompts: settings.customPrompts, // Save custom prompts
        customization: settings.customization
      };
      
      // Save updated settings to storage
      await storage.set("settings", updatedSettings);
      
      // Notify tabs about settings update
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              type: "SETTINGS_UPDATED", 
              settings: updatedSettings 
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      // Show success message briefly
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Failed to save settings");
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

  // Add a function to get the current prompt for a mode
  const getCurrentPrompts = (mode: Mode) => {
    const defaultSystemPrompt = SYSTEM_PROMPTS[mode] || "";
    const defaultUserPrompt = typeof USER_PROMPTS[mode] === 'function' 
      ? mode === 'explain' ? 'What does this mean: ${text}'
        : mode === 'summarize' ? 'Key points from: ${text}'
        : mode === 'analyze' ? 'Analyze this: ${text}'
        : mode === 'translate' ? 'Translate from ${fromLanguage} to ${toLanguage}:\n${text}'
        : '${text}'
      : USER_PROMPTS[mode] || "";

    const systemPrompt = settings.customPrompts?.systemPrompts[mode] || defaultSystemPrompt;
    const userPrompt = settings.customPrompts?.userPrompts[mode] || defaultUserPrompt;
    
    return { systemPrompt, userPrompt, defaultSystemPrompt, defaultUserPrompt };
  };

  // Function to handle editing a prompt
  const handleEditPrompt = (mode: Mode, type: 'system' | 'user') => {
    setActivePromptMode(mode);
    const { systemPrompt, userPrompt } = getCurrentPrompts(mode);
    
    if (type === 'system') {
      setEditedSystemPrompt(systemPrompt);
      setIsEditingSystemPrompt(true);
      setIsEditingUserPrompt(false);
    } else {
      setEditedUserPrompt(userPrompt);
      setIsEditingUserPrompt(true);
      setIsEditingSystemPrompt(false);
    }
  };

  // Function to save edited prompt
  const saveEditedPrompt = (type: 'system' | 'user') => {
    const currentCustomPrompts = settings.customPrompts || {
      systemPrompts: {},
      userPrompts: {}
    };
    
    let updatedCustomPrompts;
    
    if (type === 'system') {
      updatedCustomPrompts = {
        ...currentCustomPrompts,
        systemPrompts: {
          ...currentCustomPrompts.systemPrompts,
          [activePromptMode]: editedSystemPrompt
        }
      };
      setIsEditingSystemPrompt(false);
    } else {
      updatedCustomPrompts = {
        ...currentCustomPrompts,
        userPrompts: {
          ...currentCustomPrompts.userPrompts,
          [activePromptMode]: editedUserPrompt
        }
      };
      setIsEditingUserPrompt(false);
    }
    
    setSettings(prev => ({
      ...prev,
      customPrompts: updatedCustomPrompts
    }));
  };

  // Function to reset prompt to default
  const resetPromptToDefault = (mode: Mode, type: 'system' | 'user') => {
    const { defaultSystemPrompt, defaultUserPrompt } = getCurrentPrompts(mode);
    const currentCustomPrompts = settings.customPrompts || {
      systemPrompts: {},
      userPrompts: {}
    };
    
    let updatedCustomPrompts;
    
    if (type === 'system') {
      // Create a new object without the specified mode
      const { [mode]: _, ...restSystemPrompts } = currentCustomPrompts.systemPrompts;
      updatedCustomPrompts = {
        ...currentCustomPrompts,
        systemPrompts: restSystemPrompts
      };
      
      // Update the edited text if we're currently editing
      if (isEditingSystemPrompt && activePromptMode === mode) {
        setEditedSystemPrompt(defaultSystemPrompt);
      }
    } else {
      // Create a new object without the specified mode
      const { [mode]: _, ...restUserPrompts } = currentCustomPrompts.userPrompts;
      updatedCustomPrompts = {
        ...currentCustomPrompts,
        userPrompts: restUserPrompts
      };
      
      // Update the edited text if we're currently editing
      if (isEditingUserPrompt && activePromptMode === mode) {
        setEditedUserPrompt(defaultUserPrompt);
      }
    }
    
    setSettings(prev => ({
      ...prev,
      customPrompts: updatedCustomPrompts
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto p-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 py-4"
        >
          <div className="flex items-center gap-2">
            <Logo />
            <div>
              <h1 className="text-lg font-medium text-gray-800 m-0">
                LightUp Settings
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Configure your AI assistant preferences
              </p>
            </div>
          </div>
          <Badge variant="success">v0.1.5</Badge>
        </motion.div>

        <div className="grid gap-6">
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
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Llama Server URL
                    </label>
                    <input
                      type="text"
                      value={settings.serverUrl}
                      onChange={handleServerUrlChange}
                      className="w-full p-2.5 rounded-md border border-gray-300 text-gray-700 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f]"
                      placeholder="http://127.0.0.1:1234"
                    />
                    <p className="mt-1.5 text-xs text-gray-500">
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
                    <label className="block mb-2 text-sm font-medium text-gray-700">
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
                        className="w-full p-2.5 rounded-md border border-gray-300 text-gray-700 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f]"
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
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { value: '0.8rem', label: 'Small' },
                    { value: '0.9rem', label: 'Medium' },
                    { value: '1rem', label: 'Large' },
                    { value: '1.1rem', label: 'X-Large' },
                    { value: '1.2rem', label: 'XX-Large' },
                    { value: '1.3rem', label: 'XXX-Large' }
                  ].map((size) => (
                    <button
                      key={size.value}
                      onClick={() => handleImmediateSettingUpdate('fontSize', size.value)}
                      className={`p-3 rounded-lg border ${
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
                            <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 100-2v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
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

          {/* Prompt Templates */}
          <SettingsCard
            id="prompt-templates"
            title="Prompt Templates"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
            }
          >
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-4">
                Customize how LightUp processes your text for each mode. You can edit both the system prompt (instructions to the AI) and the user prompt (how your text is formatted).
              </p>
              
              <div className="mb-6">
                <label className="block mb-2 text-gray-800 font-medium">Select Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["explain", "summarize", "analyze", "translate", "free"].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setActivePromptMode(mode as Mode)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activePromptMode === mode
                          ? "bg-[#10a37f] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {mode === "explain" && "Explain"}
                      {mode === "summarize" && "Summarize"}
                      {mode === "analyze" && "Analyze"}
                      {mode === "translate" && "Translate"}
                      {mode === "free" && "Ask Anything"}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* System Prompt Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold">System Prompt</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPrompt(activePromptMode, 'system')}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => resetPromptToDefault(activePromptMode, 'system')}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Reset
                    </button>
                  </div>
                </div>
                
                {isEditingSystemPrompt && activePromptMode ? (
                  <div>
                    <textarea
                      value={editedSystemPrompt}
                      onChange={(e) => setEditedSystemPrompt(e.target.value)}
                      className="w-full h-40 p-2.5 rounded-md border border-gray-300 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f]"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setIsEditingSystemPrompt(false)}
                        className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEditedPrompt('system')}
                        className="text-xs px-2.5 py-1 rounded-md bg-[#10a37f] text-white hover:bg-[#0D8C6D] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      The system prompt provides instructions to the AI about how to respond.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {getCurrentPrompts(activePromptMode).systemPrompt}
                    
                    {settings.customPrompts?.systemPrompts[activePromptMode] && (
                      <span className="inline-block ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        Custom
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* User Prompt Section */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-semibold">User Prompt</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditPrompt(activePromptMode, 'user')}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => resetPromptToDefault(activePromptMode, 'user')}
                      className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Reset
                    </button>
                  </div>
                </div>
                
                {isEditingUserPrompt && activePromptMode ? (
                  <div>
                    <textarea
                      value={editedUserPrompt}
                      onChange={(e) => setEditedUserPrompt(e.target.value)}
                      className="w-full h-40 p-2.5 rounded-md border border-gray-300 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 focus:border-[#10a37f]"
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => setIsEditingUserPrompt(false)}
                        className="text-xs px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => saveEditedPrompt('user')}
                        className="text-xs px-2.5 py-1 rounded-md bg-[#10a37f] text-white hover:bg-[#0D8C6D] transition-colors"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Use <code className="px-1 py-0.5 bg-gray-100 rounded">${"{text}"}</code> to represent the selected text.
                      {activePromptMode === "translate" && (
                        <span> For translate mode, you can also use <code className="px-1 py-0.5 bg-gray-100 rounded">${"{fromLanguage}"}</code> and <code className="px-1 py-0.5 bg-gray-100 rounded">${"{toLanguage}"}</code>.</span>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded border border-gray-200 text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {getCurrentPrompts(activePromptMode).userPrompt}
                    
                    {settings.customPrompts?.userPrompts[activePromptMode] && (
                      <span className="inline-block ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                        Custom
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded-lg">
                <p className="font-semibold mb-1">Template Variables:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li><code className="px-1 py-0.5 bg-gray-100 rounded">${"{text}"}</code> - Your selected text</li>
                  {activePromptMode === "translate" && (
                    <>
                      <li><code className="px-1 py-0.5 bg-gray-100 rounded">${"{fromLanguage}"}</code> - Source language</li>
                      <li><code className="px-1 py-0.5 bg-gray-100 rounded">${"{toLanguage}"}</code> - Target language</li>
                    </>
                  )}
                </ul>
              </div>
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
            <div className="flex flex-col gap-3 w-full">
              {error && <ErrorMessage message={error} />}
              {saveSuccess && (
                <div className="flex items-center justify-center text-green-600 bg-green-50 py-2 px-4 rounded-lg w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Settings saved successfully!
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full px-4 py-2.5 bg-[#10a37f] hover:bg-[#0D8C6D] text-white font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#10a37f]/20 disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toast */}
      <div id="toast" className="fixed bottom-4 right-4 bg-[#10a37f] text-white px-4 py-2 rounded-md text-sm opacity-0 transition-opacity duration-200 shadow-md" />
    </div>
  );
}

export default IndexOptions;