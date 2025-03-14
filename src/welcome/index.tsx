import { useEffect, useState } from "react"
import { Storage } from "@plasmohq/storage"
import "../style.css"
import type { Settings } from "~types/settings"

const Logo = () => (
  <svg width="50" height="50" viewBox="0 0 202 201" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <filter id="filter1_d_171_147" x="3.90283" y="3.01889" width="195.759" height="196.803" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
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
    </defs>
  </svg>
)

function Welcome() {
  const [currentStep, setCurrentStep] = useState(1)
  const [settings, setSettings] = useState<Settings>({
    modelType: "openai",
    maxTokens: 2048,
    apiKey: "",
    geminiApiKey: "",
    xaiApiKey: "",
    customization: {
      showSelectedText: false,
      theme: "light",
      radicallyFocus: false,
      fontSize: "1rem",
      highlightColor: "default",
      popupAnimation: "scale",
      persistHighlight: false,
      layoutMode: "sidebar"
    }
  })

  const handleNext = () => {
    setCurrentStep(prev => prev + 1)
  }

  const handleComplete = async () => {
    const storage = new Storage()
    await storage.set("settings", settings)
    await storage.set("onboardingComplete", true)
    window.close()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 font-k2d">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Welcome to LightUp</h1>
          <p className="text-lg text-gray-600">Let's get you set up in just a few steps</p>
        </div>

        {/* Progress bar */}
        <div className="mb-12">
          <div className="h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-[#10a37f] rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>Choose Model</span>
            <span>API Setup</span>
            <span>Final Steps</span>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Choose your AI model</h2>
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, modelType: "gemini" }))
                    handleNext()
                  }}
                  className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <h3 className="font-medium text-lg">Google Gemini</h3>
                    <p className="text-gray-500">Google's latest AI model</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <button
                  onClick={() => {
                    setSettings(prev => ({ ...prev, modelType: "xai" }))
                    handleNext()
                  }}
                  className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <div>
                    <h3 className="font-medium text-lg">xAI (Grok)</h3>
                    <p className="text-gray-500">Powered by Grok model</p>
                  </div>
                  <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Enter your API key</h2>
              <p className="text-gray-600 mb-6">
                {settings.modelType === "openai" ? (
                  <>Get your API key from the <a href="https://platform.openai.com/docs/overview" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">OpenAI platform</a>.</>
                ) : settings.modelType === "gemini" ? (
                  <>Get your API key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google AI Studio</a>.</>
                ) : (
                  <>Get your API key from the <a href="https://x.ai/api" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">xAI platform</a>.</>
                )}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f] outline-none"
                  placeholder="Enter your API key"
                  value={
                    settings.modelType === "openai" ? settings.apiKey :
                    settings.modelType === "gemini" ? settings.geminiApiKey :
                    settings.xaiApiKey
                  }
                  onChange={(e) => {
                    const value = e.target.value
                    setSettings(prev => ({
                      ...prev,
                      apiKey: settings.modelType === "openai" ? value : prev.apiKey,
                      geminiApiKey: settings.modelType === "gemini" ? value : prev.geminiApiKey,
                      xaiApiKey: settings.modelType === "xai" ? value : prev.xaiApiKey
                    }))
                  }}
                />
              </div>
              <button
                onClick={handleNext}
                disabled={!settings.apiKey && !settings.geminiApiKey && !settings.xaiApiKey}
                className="w-full bg-[#10a37f] text-white py-3 rounded-lg hover:bg-[#0d8c6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">You're all set!</h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2">How to use LightUp:</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600">
                    <li>Select any text on a webpage</li>
                    <li>A LightUp popup will appear</li>
                    <li>Choose an action (Explain, Summarize, etc.)</li>
                    <li>Get instant AI-powered insights</li>
                  </ol>
                </div>
                <button
                  onClick={handleComplete}
                  className="w-full bg-[#10a37f] text-white py-3 rounded-lg hover:bg-[#0d8c6d] transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Welcome 