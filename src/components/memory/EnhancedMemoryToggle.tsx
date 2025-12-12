import React from "react";
import { useEnhancedMemory } from "~hooks/useEnhancedMemory";

/**
 * Enhanced Memory Toggle Component
 * Provides UI controls for LangChain memory integration
 */

interface EnhancedMemoryToggleProps {
  className?: string;
  compact?: boolean;
}

export const EnhancedMemoryToggle: React.FC<EnhancedMemoryToggleProps> = ({
  className = "",
  compact = false
}) => {
  const {
    memoryState,
    toggleMemory,
    clearMemory,
    getMemoryStats
  } = useEnhancedMemory();

  const handleToggleMemory = () => {
    toggleMemory(!memoryState.isEnabled);
  };

  const handleClearMemory = async () => {
    if (confirm("Are you sure you want to clear all conversation memory? This action cannot be undone.")) {
      await clearMemory();
    }
  };

  const handleRefreshStats = async () => {
    await getMemoryStats();
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <label className="flex items-center space-x-1">
          <input
            type="checkbox"
            checked={memoryState.isEnabled}
            onChange={handleToggleMemory}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Enhanced Memory</span>
        </label>
        
        {memoryState.isEnabled && memoryState.memoryStats.messageCount > 0 && (
          <span className="text-xs text-gray-500">
            {memoryState.memoryStats.messageCount} msgs
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Enhanced Memory</h3>
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={memoryState.isEnabled}
              onChange={handleToggleMemory}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Enable</span>
          </label>
        </div>
      </div>

      {memoryState.error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{memoryState.error}</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-sm text-gray-600">
          <p>
            Enhanced memory uses LangChain to maintain conversation context across multiple exchanges.
            It automatically summarizes long conversations to stay within token limits.
          </p>
        </div>

        {memoryState.isEnabled && (
          <div className="bg-gray-50 rounded-md p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Memory Statistics</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Messages:</span>
                <span className="ml-2 font-medium">{memoryState.memoryStats.messageCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Tokens:</span>
                <span className="ml-2 font-medium">{memoryState.memoryStats.tokenCount}</span>
              </div>
              <div>
                <span className="text-gray-500">Summary:</span>
                <span className="ml-2 font-medium">
                  {memoryState.memoryStats.hasSummary ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>
                <span className="ml-2 font-medium capitalize">
                  {memoryState.memoryStats.memoryType.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        )}

        {memoryState.isEnabled && (
          <div className="flex space-x-2">
            <button
              onClick={handleRefreshStats}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
            >
              Refresh Stats
            </button>
            
            {memoryState.memoryStats.messageCount > 0 && (
              <button
                onClick={handleClearMemory}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              >
                Clear Memory
              </button>
            )}
          </div>
        )}

        {memoryState.isLoading && (
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Compact memory status indicator for use in headers/toolbars
 */
export const MemoryStatusIndicator: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { memoryState } = useEnhancedMemory();

  if (!memoryState.isEnabled) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-1 text-xs ${className}`}>
      <div className={`w-2 h-2 rounded-full ${
        memoryState.error ? 'bg-red-500' : 
        memoryState.isLoading ? 'bg-yellow-500' : 
        'bg-green-500'
      }`} />
      <span className="text-gray-600">
        Memory: {memoryState.memoryStats.messageCount} msgs
        {memoryState.memoryStats.hasSummary && " (summarized)"}
      </span>
    </div>
  );
};

export default EnhancedMemoryToggle; 