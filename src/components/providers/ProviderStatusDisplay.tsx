import React, { useState, useEffect } from 'react';
import { useSettings } from '~hooks/useSettings';

interface ProviderStatus {
  provider: string;
  available: boolean;
  supportsMemory: boolean;
  apiKeyPresent: boolean;
  enhanced: boolean;
}

const ProviderStatusDisplay: React.FC = () => {
  const { settings } = useSettings();
  const [providerStatus, setProviderStatus] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProviders = async () => {
      if (!settings) return;
      
      try {
        // Import the health check function
        const { checkProviderHealth } = await import('~services/llm/multi-provider-enhanced');
        const health = await checkProviderHealth(settings);
        
        // Map to our display format
        const statusData = health.map(h => ({
          provider: h.provider,
          available: h.available,
          supportsMemory: h.supportsMemory,
          apiKeyPresent: h.apiKeyPresent,
          enhanced: h.supportsMemory // All providers with memory support are now fully enhanced
        }));
        
        setProviderStatus(statusData);
      } catch (error) {
        console.error('Failed to check provider health:', error);
        // Fallback status based on settings
        const fallbackStatus = [
          {
            provider: 'openai',
            available: !!(settings.apiKey || (settings as any).openaiApiKey),
            supportsMemory: true,
            apiKeyPresent: !!(settings.apiKey || (settings as any).openaiApiKey),
            enhanced: true
          },
          {
            provider: 'gemini',
            available: !!(settings as any).geminiApiKey,
            supportsMemory: true,
            apiKeyPresent: !!(settings as any).geminiApiKey,
            enhanced: false
          },
          {
            provider: 'xai',
            available: !!(settings as any).xaiApiKey,
            supportsMemory: true,
            apiKeyPresent: !!(settings as any).xaiApiKey,
            enhanced: false
          },
          {
            provider: 'local',
            available: !!settings.serverUrl,
            supportsMemory: true,
            apiKeyPresent: !!settings.serverUrl,
            enhanced: false
          },
          {
            provider: 'basic',
            available: true,
            supportsMemory: true,
            apiKeyPresent: true,
            enhanced: true
          }
        ];
        setProviderStatus(fallbackStatus);
      } finally {
        setLoading(false);
      }
    };

    checkProviders();
  }, [settings]);

  const getProviderDisplayName = (provider: string) => {
    switch (provider) {
      case 'openai': return 'OpenAI';
      case 'gemini': return 'Google Gemini';
      case 'xai': return 'xAI Grok';
      case 'local': return 'Local Model';
      case 'basic': return 'Basic';
      default: return provider;
    }
  };

  const getStatusColor = (available: boolean) => {
    return available ? 'text-green-600' : 'text-red-600';
  };

  const getEnhancementBadge = (provider: ProviderStatus) => {
    if (provider.enhanced) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Fully Enhanced
        </span>
      );
    } else if (provider.supportsMemory) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Memory Enhanced
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Basic
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking providers...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider Status</h3>
      
      <div className="space-y-3">
        {providerStatus.map((provider) => (
          <div
            key={provider.provider}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                provider.available ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              
              <div>
                <div className="font-medium text-gray-900">
                  {getProviderDisplayName(provider.provider)}
                </div>
                <div className="text-sm text-gray-500">
                  {provider.available ? 'Available' : 'Not configured'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {getEnhancementBadge(provider)}
              
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {provider.supportsMemory && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-100 text-purple-700">
                    Memory
                  </span>
                )}
                {provider.apiKeyPresent && provider.provider !== 'basic' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-100 text-green-700">
                    API Key
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <div className="w-5 h-5 text-blue-600 mt-0.5">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm text-blue-800">
            <p className="font-medium">Enhancement Levels:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li><strong>Fully Enhanced:</strong> AI SDK + Memory + Performance tracking</li>
              <li><strong>Memory Enhanced:</strong> Conversation memory + Performance tracking</li>
              <li><strong>Basic:</strong> Standard functionality only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderStatusDisplay; 