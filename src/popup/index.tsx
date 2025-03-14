import { useState, useEffect } from "react"
import { Storage } from "@plasmohq/storage"
import { sendToBackground } from "@plasmohq/messaging"
import { motion, AnimatePresence } from "framer-motion"

import type { Mode, TranslationSettings, Settings } from "~types/settings"
import { LANGUAGES } from "~utils/constants"
import { useSettings } from "~hooks/useSettings"
import { useRateLimit } from "~hooks/useRateLimit"

// Import the popup-specific CSS file
import "./popup-style.css"

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

// Add this interface and component before IndexPopup
interface ActionButtonProps {
  mode: Mode
  activeMode: Mode
  onClick: () => void
  children: React.ReactNode
}

const ActionButton = ({ mode, activeMode, onClick, children }: ActionButtonProps) => {
  const icons = {
    summarize: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4h16v16H4V4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M4 8h16M8 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    analyze: (
      <svg width="20" height="20" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M35.9064 0.109375C16.194 0.109375 0.136719 16.1667 0.136719 35.8791C0.136719 55.5914 16.194 71.6487 35.9064 71.6487C44.44 71.6487 52.2816 68.6328 58.4391 63.6205L83.5695 95.1014C83.5695 95.1014 89.0738 95.9195 92.4913 92.358C95.9325 88.7694 95.1254 83.5488 95.1254 83.5488L63.6478 58.4117C68.6602 52.2543 71.6761 44.4127 71.6761 35.8791C71.6761 16.1667 55.6188 0.109375 35.9064 0.109375ZM35.9064 7.26397C51.7528 7.26397 64.5215 20.0327 64.5215 35.8791C64.5215 51.7254 51.7528 64.4941 35.9064 64.4941C20.06 64.4941 7.29132 51.7254 7.29132 35.8791C7.29132 20.0327 20.06 7.26397 35.9064 7.26397Z" fill="currentColor"/>
      </svg>
    ),
    explain: (
      <svg width="20" height="20" viewBox="0 0 89 99" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.55007 23.009C0.994225 23.8875 0.0273438 25.5563 0.0273438 27.3624V71.2893C0.0273438 73.1053 0.994225 74.7642 2.55007 75.6427C10.3882 80.0649 34.2363 93.503 41.8389 97.7877C42.5849 98.2049 43.4045 98.416 44.2291 98.416C45.034 98.416 45.8389 98.2147 46.5702 97.8123C54.1727 93.6159 77.9325 80.5213 85.805 76.1777C87.3903 75.309 88.3719 73.6304 88.3719 71.8046V27.3624C88.3719 25.5563 87.405 23.8875 85.8443 23.009C78.0159 18.5967 54.2169 5.18303 46.5849 0.883599C45.8438 0.466416 45.0193 0.255371 44.1996 0.255371C43.3751 0.255371 42.5554 0.466416 41.8143 0.883599C34.1823 5.18303 10.3784 18.5967 2.55007 23.009ZM81.0098 33.3895V70.3224L47.8806 88.5901V51.397L81.0098 33.3895ZM11.0017 26.7931L44.1996 8.07877L77.5791 26.8962L44.1996 45.1344L11.0017 26.7931Z" fill="currentColor"/>
      </svg>
    ),
    translate: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 5h12M9 3v2m1.048 8.5A18.022 18.022 0 008 5.3m3.048 8.2l1.452 3.2m-1.452-3.2a18.019 18.019 0 002.048-3.2M9 19l3-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    free: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 12h8M12 8v8M12 21a9 9 0 100-18 9 9 0 000 18z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  }

  // Tooltip descriptions for each mode
  const tooltips = {
    summarize: "Condense text into key points",
    analyze: "Examine text for insights and patterns",
    explain: "Clarify complex concepts in simple terms",
    translate: "Convert text to another language",
    free: "Ask any question about selected text"
  }

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
          activeMode === mode 
            ? "bg-[#14742F] text-white" 
            : "bg-[#D6D6D6] text-black hover:bg-[#C4C4C4]"
        }`}
        aria-label={`${children} - ${tooltips[mode]}`}
        title={tooltips[mode]}>
        {icons[mode]}
        {children}
      </button>
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
        {tooltips[mode]}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  )
}

// Add ShortcutsSection component
const ShortcutsSection = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shortcuts = [
    { key: "Ctrl+Shift+Z", description: "Switch to Explain mode" },
    { key: "Ctrl+Shift+S", description: "Switch to Summarize mode" },
    { key: "Ctrl+Shift+A", description: "Switch to Analyze mode" },
    { key: "Ctrl+Shift+T", description: "Switch to Translate mode" },
    { key: "Ctrl+Shift+F / Command+Shift+F", description: "Open popup in Free mode" },
    { key: "Ctrl+Shift+X", description: "Toggle LightUp on/off" },
    { key: "Ctrl+Shift+R", description: "Toggle Radically Focus mode" },
    { key: "Ctrl+Shift+D", description: "Toggle Light/Dark theme" }
  ];
  
  return (
    <div className="mt-4 p-4 bg-white rounded-lg shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-black flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M6 10h2v2H6v-2zM10 10h2v2h-2v-2zM14 10h2v2h-2v-2zM6 14h12v2H6v-2z" fill="currentColor" />
          </svg>
          Keyboard Shortcuts
        </h3>
        <button 
          className="text-gray-500 hover:text-gray-700"
          aria-label={isExpanded ? "Collapse shortcuts" : "Expand shortcuts"}
        >
          <svg 
            className={`w-4 h-4 transition-transform ${isExpanded ? "transform rotate-180" : ""}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-1 gap-2 border-b border-gray-100 pb-2">
            <p className="text-xs text-gray-600 italic">
              Use these shortcuts to quickly switch between modes or toggle features
            </p>
          </div>
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-700">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-md shadow-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-1 pt-1">
            After setting the mode via shortcut, select any text and LightUp will appear with your chosen mode.
          </p>
        </div>
      )}
    </div>
  );
};

// Add RateLimitDisplay component
const RateLimitDisplay = () => {
  const { remainingActions, isLoading, error } = useRateLimit()
  
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
        <p className="text-gray-500 text-sm">Loading usage info...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg shadow-sm">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
      <h3 className="text-sm font-semibold mb-2">Daily Usage</h3>
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-600 text-sm">Actions Remaining Today</span>
        <span className="text-sm font-medium">
          {remainingActions} / 20
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-[#14742F] h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${(remainingActions / 20) * 100}%` }}
        ></div>
      </div>
    </div>
  )
}

// Add a new Switch component for settings
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

// Add a new SettingsSection component
const SettingsSection = ({ isOpen, onClose, settings, updateSettings }) => {
  if (!isOpen) return null;

  const colorOptions = [
    { value: 'default', label: 'Default', color: 'bg-gray-200' },
    { value: 'orange', label: 'Orange', color: 'bg-[#FFBF5A]' },
    { value: 'blue', label: 'Blue', color: 'bg-[#93C5FD]' },
    { value: 'green', label: 'Green', color: 'bg-[#86EFAC]' },
    { value: 'purple', label: 'Purple', color: 'bg-[#C4B5FD]' },
    { value: 'pink', label: 'Pink', color: 'bg-[#FDA4AF]' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="absolute inset-0 bg-white z-10 flex flex-col h-full"
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-lg font-semibold">Quick Settings</h2>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-grow">
        <div className="space-y-6">
          {/* Layout Mode Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Layout Mode</label>
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
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSettings('layoutMode', option.value)}
                  className={`p-3 rounded-lg border ${
                    settings.customization?.layoutMode === option.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {option.icon}
                    <span className="text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4">
            <Switch
              id="show-selected-text"
              checked={settings.customization?.showSelectedText ?? true}
              onChange={(e) => updateSettings('showSelectedText', e.target.checked)}
              label="Show Selected Text"
              description="Display the text you've selected in the results"
            />

            <Switch
              id="radical-focus"
              checked={settings.customization?.radicallyFocus ?? false}
              onChange={(e) => updateSettings('radicallyFocus', e.target.checked)}
              label="Radical Focus Mode"
              description="Blur background when viewing results"
            />

            <Switch
              id="persistent-highlight"
              checked={settings.customization?.persistHighlight ?? false}
              onChange={(e) => updateSettings('persistHighlight', e.target.checked)}
              label="Persistent Highlighting"
              description="Keep text highlighted after closing popup"
            />

            <Switch
              id="activation-mode"
              checked={(settings.customization?.activationMode ?? "automatic") === "automatic"}
              onChange={(e) => updateSettings('activationMode', e.target.checked ? "automatic" : "manual")}
              label="Automatic Activation"
              description="Show popup automatically when text is selected (or use right-click menu when disabled)"
            />
          </div>

          {/* Font Size Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Font Size</label>
            <div className="grid grid-cols-3 gap-2">
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
                  onClick={() => updateSettings('fontSize', size.value)}
                  className={`p-2 rounded-lg border ${
                    settings.customization?.fontSize === size.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-gray-600`} style={{ fontSize: size.value }}>Aa</span>
                    <span className="text-xs">{size.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Theme</label>
            <div className="grid grid-cols-2 gap-3">
              {['light', 'dark'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => updateSettings('theme', theme)}
                  className={`p-3 rounded-lg border ${
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

          {/* Highlight Color Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Highlight Color</label>
            <div className="grid grid-cols-3 gap-3">
              {colorOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateSettings('highlightColor', option.value)}
                  className={`p-3 rounded-lg border ${
                    settings.customization?.highlightColor === option.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-6 h-6 rounded-full ${option.color}`}></div>
                    <span className="text-sm">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Animation Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-800">Popup Animation</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'none', label: 'None' },
                { value: 'scale', label: 'Scale' },
                { value: 'fade', label: 'Fade' }
              ].map((animation) => (
                <button
                  key={animation.value}
                  onClick={() => updateSettings('popupAnimation', animation.value)}
                  className={`p-3 rounded-lg border ${
                    settings.customization?.popupAnimation === animation.value
                      ? 'border-[#10a37f] bg-[#10a37f]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <span className="text-sm">{animation.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function IndexPopup() {
  console.log("Popup component mounting...")
  
  const [activeMode, setActiveMode] = useState<Mode>("explain")
  const [fromLanguage, setFromLanguage] = useState("en")
  const [toLanguage, setToLanguage] = useState("es")
  const [customInstruction, setCustomInstruction] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [showSaveAnimation, setShowSaveAnimation] = useState(false)
  const [showModeConfig, setShowModeConfig] = useState(false)
  const [preferredModes, setPreferredModes] = useState<Mode[]>(["summarize", "explain", "analyze", "free"])
  const [showSettings, setShowSettings] = useState(false)
  const storage = new Storage()
  const { settings, setSettings } = useSettings()
  const isContextAwareEnabled = settings?.customization && 'contextAwareness' in settings.customization 
    ? settings.customization.contextAwareness 
    : false

  // All available modes
  const allModes: Mode[] = ["summarize", "analyze", "explain", "translate", "free"]

  useEffect(() => {
    console.log("Loading saved settings...")
    const loadSavedSettings = async () => {
      try {
        const savedMode = await storage.get("mode") as Mode
        const savedTranslationSettings = await storage.get("translationSettings") as TranslationSettings
        const savedPreferredModes = await storage.get("preferredModes") as Mode[] | undefined
        
        console.log("Saved mode:", savedMode)
        console.log("Saved translation settings:", savedTranslationSettings)
        console.log("Saved preferred modes:", savedPreferredModes)
        
        if (savedMode) {
          setActiveMode(savedMode)
        }
        if (savedTranslationSettings) {
          setFromLanguage(savedTranslationSettings.fromLanguage)
          setToLanguage(savedTranslationSettings.toLanguage)
        }
        if (savedPreferredModes && savedPreferredModes.length > 0) {
          setPreferredModes(savedPreferredModes)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }
    loadSavedSettings()
  }, [])

  const handleModeChange = async (mode: Mode) => {
    setActiveMode(mode)
    await storage.set("mode", mode)
    
    // Check if the selected mode is in the preferred modes
    if (!preferredModes.includes(mode)) {
      // Add the mode to preferred modes
      let newPreferredModes: Mode[];
      
      if (preferredModes.length >= 4) {
        // If we already have 4 modes, replace the last one
        newPreferredModes = [...preferredModes.slice(0, 3), mode];
      } else {
        // Otherwise, just add it
        newPreferredModes = [...preferredModes, mode];
      }
      
      setPreferredModes(newPreferredModes);
      await storage.set("preferredModes", newPreferredModes);
      
      // Also update settings if they exist
      const currentSettings = await storage.get("settings") as Settings | undefined;
      if (currentSettings) {
        const updatedSettings = {
          ...currentSettings,
          preferredModes: newPreferredModes
        };
        
        await storage.set("settings", updatedSettings);
        
        // Notify all tabs about the mode configuration changes
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            if (tab.id) {
              chrome.tabs.sendMessage(tab.id, { 
                type: "MODES_UPDATED", 
                settings: updatedSettings,
                preferredModes: newPreferredModes
              }).catch(err => {
                // Ignore errors for tabs that don't have the content script running
                console.log(`Could not send message to tab ${tab.id}:`, err);
              });
            }
          });
        });
      }
    }
    
    if (mode === "translate") {
      const translationSettings = {
        fromLanguage,
        toLanguage
      };
     
      await storage.set("translationSettings", translationSettings);
    }
    
    // Notify all tabs about the mode change
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { 
            type: "MODE_CHANGED", 
            mode,
            translationSettings: mode === "translate" ? { fromLanguage, toLanguage } : undefined,
            reprocessExisting: true // Add this flag to indicate we want to reprocess existing text
          }).catch(err => {
            // Ignore errors for tabs that don't have the content script running
            console.log(`Could not send message to tab ${tab.id}:`, err);
          });
        }
      });
    });
  }

  // Function to toggle a mode in the preferred modes list
  const togglePreferredMode = async (mode: Mode) => {
    let newPreferredModes: Mode[]
    
    if (preferredModes.includes(mode)) {
      // Don't allow removing if it would result in less than 1 mode
      if (preferredModes.length <= 1) {
        return
      }
      // Remove the mode
      newPreferredModes = preferredModes.filter(m => m !== mode)
    } else {
      // Don't allow adding if already at 4 modes
      if (preferredModes.length >= 4) {
        return
      }
      // Add the mode
      newPreferredModes = [...preferredModes, mode]
    }
    
    setPreferredModes(newPreferredModes)
    await storage.set("preferredModes", newPreferredModes)
    
    // Also update settings if they exist
    const currentSettings = await storage.get("settings") as Settings | undefined
    if (currentSettings) {
      const updatedSettings = {
        ...currentSettings,
        preferredModes: newPreferredModes
      };
      
      await storage.set("settings", updatedSettings);
      
      // Notify all tabs about the mode configuration changes
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              type: "MODES_UPDATED", 
              settings: updatedSettings,
              preferredModes: newPreferredModes
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
      
      // Show a brief success animation
      setShowSaveAnimation(true);
      setTimeout(() => {
        setShowSaveAnimation(false);
      }, 1500);
    }
  }

  useEffect(() => {
    if (activeMode === "translate") {
      storage.set("translationSettings", {
        fromLanguage,
        toLanguage
      });
    }
  }, [fromLanguage, toLanguage, activeMode]);

  // Add a new function to handle immediate settings updates
  const handleImmediateSettingUpdate = async (key: string, value: any) => {
    try {
      if (!settings) return;
      
      const newSettings = {
        ...settings,
        customization: {
          ...settings.customization,
          [key]: value
        }
      };
      
      setSettings(newSettings);
      await storage.set("settings", newSettings);
      
      // Notify all tabs about the settings change
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, { 
              type: "SETTINGS_UPDATED", 
              settings: newSettings,
              key,
              value
            }).catch(err => {
              // Ignore errors for tabs that don't have the content script running
              console.log(`Could not send message to tab ${tab.id}:`, err);
            });
          }
        });
      });
      
      // Dispatch a custom event to notify content scripts of the setting change
      const event = new CustomEvent('settingUpdated', { 
        detail: { 
          key,
          value,
          message: `${key} setting updated successfully` 
        } 
      });
      window.dispatchEvent(event);
      
      // Show a brief success animation
      setShowSaveAnimation(true);
      setTimeout(() => {
        setShowSaveAnimation(false);
      }, 1500);
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
    }
  };

  const handleOpenOptions = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") })
  }

  const handleOpenPromptTemplates = () => {
    // Open the options page with the prompt-templates hash
    chrome.tabs.create({ 
      url: chrome.runtime.getURL("options.html#prompt-templates"),
      active: true
    });
  }

  return (
    <div className="w-[600px] h-[500px] font-['K2D'] bg-[#E9E9E9] relative overflow-hidden">
      {/* Toast notification for settings saved */}
      <AnimatePresence>
        {showSaveAnimation && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 bg-[#10a37f] text-white px-4 py-2 rounded-md shadow-md z-50"
          >
            Setting updated successfully
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsSection 
            isOpen={showSettings} 
            onClose={() => setShowSettings(false)} 
            settings={settings} 
            updateSettings={handleImmediateSettingUpdate}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      {!showSettings && (
        <div className="h-full flex flex-col overflow-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-[#D6D6D6]">
            <div className="flex items-center gap-2">
              <Logo />
              <h1 className="text-xl font-semibold">LightUp</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group">
                <div className="absolute -top-2 right-0">
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-black text-white">
                    new
                  </span>
                </div>
                <button 
                  onClick={() => setShowSettings(true)}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
                  aria-label="Settings"
                  tabIndex={0}
                >
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                  Settings
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Customize LightUp appearance and behavior
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                </div>
              </div>
              <div className="relative group">
                <button 
                  onClick={handleOpenOptions}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
                  aria-label="Advanced Settings"
                  tabIndex={0}
                >
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                  Advanced
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Configure advanced settings and API options
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -top-2 right-0">
                  <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-black text-white">
                    new
                  </span>
                </div>
                <button 
                  onClick={handleOpenPromptTemplates}
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
                  aria-label="Prompt Templates"
                  tabIndex={0}
                >
                  <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                  Templates
                </button>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Customize prompt templates for each mode
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#E9E9E9] p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between gap-2 mb-6">
              <h2 className="text-xl font-medium text-black flex items-center gap-2">
                Define LightUp's purpose
                <span className="text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <path d="M12 16v-4M12 8h.01" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
              </h2>
              <button 
                onClick={() => setShowModeConfig(!showModeConfig)}
                className="text-sm flex items-center gap-1 px-3 py-1 rounded-full bg-[#D6D6D6] hover:bg-[#C4C4C4] transition-all"
              >
                {showModeConfig ? "Hide Mode Config" : "Configure Modes"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6v12m-6-6h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform={showModeConfig ? "rotate(45, 12, 12)" : ""}/>
                </svg>
              </button>
            </div>
            
            {showModeConfig && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
                <h3 className="text-base mb-3 text-black font-medium">Configure Mode Selector (Choose up to 4)</h3>
                <div className="flex flex-wrap gap-2">
                  {allModes.map((mode) => (
                    <div key={mode} className="relative group">
                      <button
                        onClick={() => togglePreferredMode(mode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                          preferredModes.includes(mode)
                            ? "bg-[#14742F] text-white"
                            : "bg-[#D6D6D6] text-black hover:bg-[#C4C4C4]"
                        }`}
                        title={mode === "summarize" ? "Condense text into key points" :
                               mode === "analyze" ? "Examine text for insights and patterns" :
                               mode === "explain" ? "Clarify complex concepts in simple terms" :
                               mode === "translate" ? "Convert text to another language" :
                               "Ask any question about selected text"}
                      >
                        {preferredModes.includes(mode) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12l5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {mode === "summarize" && "Summarize"}
                        {mode === "analyze" && "Analyze"}
                        {mode === "explain" && "Explain"}
                        {mode === "translate" && "Translate"}
                        {mode === "free" && "Ask Anything"}
                      </button>
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                        {mode === "summarize" ? "Condense text into key points" :
                         mode === "analyze" ? "Examine text for insights and patterns" :
                         mode === "explain" ? "Clarify complex concepts in simple terms" :
                         mode === "translate" ? "Convert text to another language" :
                         "Ask any question about selected text"}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These modes will appear in the mode selector when using LightUp.
                </p>
              </div>
            )}
            
            <div>
              <h3 className="text-base mb-4 text-black font-['K2D']">Available actions</h3>
              <div className="flex flex-wrap gap-2">
                <ActionButton
                  mode="summarize"
                  activeMode={activeMode}
                  onClick={() => handleModeChange("summarize")}>
                  Summarize
                </ActionButton>
                <ActionButton
                  mode="analyze"
                  activeMode={activeMode}
                  onClick={() => handleModeChange("analyze")}>
                  Analyze
                </ActionButton>
                <ActionButton
                  mode="explain"
                  activeMode={activeMode}
                  onClick={() => handleModeChange("explain")}>
                  Explain
                </ActionButton>
                <ActionButton
                  mode="translate"
                  activeMode={activeMode}
                  onClick={() => handleModeChange("translate")}>
                  Translate
                </ActionButton>
                <ActionButton
                  mode="free"
                  activeMode={activeMode}
                  onClick={() => handleModeChange("free")}>
                  Ask Anything
                </ActionButton>
              </div>
            </div>

            {activeMode === "translate" && (
              <div className="flex gap-4 mt-6">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    From
                  </label>
                  <select
                    value={fromLanguage}
                    onChange={(e) => setFromLanguage(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    To
                  </label>
                  <select
                    value={toLanguage}
                    onChange={(e) => setToLanguage(e.target.value)}
                    className="w-full p-2 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {activeMode === "free" && (
              <div className="mt-6">
                <div className="p-4 bg-[#F5F5F5] rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-700">
                    In "Ask Anything" mode, you can have free-form conversations with the AI about any topic.
                    {settings?.customization?.layoutMode === "sidebar" ? (
                      <span> With sidebar layout enabled, simply move your cursor to the far right edge of the screen to activate the AI assistant - no text selection needed.</span>
                    ) : settings?.customization?.layoutMode === "centered" ? (
                      <span> With centered layout, the AI assistant appears as a larger modal in the middle of your screen with a blurred background for a more immersive experience.</span>
                    ) : (
                      <span> With floating layout, you can either highlight text to ask about specific content or use the popup for general questions.</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-auto pt-12 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isContextAwareEnabled && (
                  <div 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14742F]/10 text-[#14742F] rounded-lg text-sm"
                    title="Context awareness is enabled">
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      strokeWidth="2" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Context Aware
                  </div>
                )}
              </div>
              
              {/* Add Daily Usage component */}
              <div className="w-full">
                <RateLimitDisplay />
              </div>
            </div>

            {/* Add Shortcuts Section */}
            <div className="mt-3">
              <ShortcutsSection />
            </div>

            {/* Social Media Links */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">

               <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenOptions}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 pr-3 pl-0 py-1.5 rounded-lg hover:bg-gray-200/50 transition-colors"
                    aria-label="Open settings"
                    tabIndex={0}>
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      strokeWidth="2" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24">
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <a
                    onClick={() => {
                      chrome.tabs.create({
                        url: chrome.runtime.getURL("tabs/feedback.html")
                      })
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-gray-200/50 transition-colors cursor-pointer"
                    aria-label="Tell Us Your Opinion"
                    tabIndex={0}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Tell Us Your Opinion
                  </a>
                </div>
                <div className="flex items-center gap-4">
                  <a
                    href="https://github.com/mohamedsadiq/LightUp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="GitHub"
                    tabIndex={0}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.756-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.237 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                    </svg>
                  </a>
                  <a
                    href="https://x.com/Lightupaii"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label="X (Twitter)"
                    tabIndex={0}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/lightupaiapp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                    aria-label="Instagram"
                    tabIndex={0}>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                  </a>
                </div>
               
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PopupWithErrorBoundary() {
  return (
  
      <IndexPopup />
  
  )
}
export default PopupWithErrorBoundary

