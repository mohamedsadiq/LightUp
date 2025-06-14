/**
 * Production-ready API Key Validation System
 * Features: Format validation, API verification, throttling, secure storage
 */

export interface ApiKeyValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    format: boolean;
    connection: boolean;
    permissions: boolean;
    quota?: {
      remaining: number;
      resetTime: number;
    };
  };
  timestamp: number;
}

export interface ApiKeyConfig {
  provider: 'openai' | 'gemini' | 'xai' | 'custom';
  endpoint?: string;
  testModel?: string;
  formatPattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  prefix?: string;
  throttleMs?: number;
  cacheValidationMs?: number;
}

interface ValidationCache {
  [key: string]: {
    result: ApiKeyValidationResult;
    timestamp: number;
  };
}

interface ThrottleState {
  [key: string]: number; // last validation timestamp
}

export class ApiKeyValidator {
  private cache: ValidationCache = {};
  private throttleState: ThrottleState = {};
  private validationInProgress: Set<string> = new Set();

  private defaultConfigs: Record<string, ApiKeyConfig> = {
    openai: {
      provider: 'openai',
      endpoint: 'https://api.openai.com/v1/models',
      formatPattern: /^sk-[a-zA-Z0-9]{48,}$/,
      minLength: 51,
      prefix: 'sk-',
      throttleMs: 5000,
      cacheValidationMs: 300000 // 5 minutes
    },
    gemini: {
      provider: 'gemini',
      endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
      formatPattern: /^[a-zA-Z0-9_-]{39}$/,
      minLength: 39,
      maxLength: 39,
      throttleMs: 5000,
      cacheValidationMs: 300000
    },
    xai: {
      provider: 'xai',
      endpoint: 'https://api.x.ai/v1/models',
      formatPattern: /^xai-[a-zA-Z0-9]{50,}$/,
      minLength: 54,
      prefix: 'xai-',
      throttleMs: 5000,
      cacheValidationMs: 300000
    }
  };

  /**
   * Validate API key format only
   */
  public validateFormat(apiKey: string, config: ApiKeyConfig): ApiKeyValidationResult {
    const result: ApiKeyValidationResult = {
      isValid: false,
      timestamp: Date.now(),
      details: {
        format: false,
        connection: false,
        permissions: false
      }
    };

    // Basic checks
    if (!apiKey || typeof apiKey !== 'string') {
      result.error = 'API key is required';
      return result;
    }

    const trimmedKey = apiKey.trim();
    
    // Length validation
    if (config.minLength && trimmedKey.length < config.minLength) {
      result.error = `API key too short (minimum ${config.minLength} characters)`;
      return result;
    }

    if (config.maxLength && trimmedKey.length > config.maxLength) {
      result.error = `API key too long (maximum ${config.maxLength} characters)`;
      return result;
    }

    // Prefix validation
    if (config.prefix && !trimmedKey.startsWith(config.prefix)) {
      result.error = `API key must start with "${config.prefix}"`;
      return result;
    }

    // Pattern validation
    if (config.formatPattern && !config.formatPattern.test(trimmedKey)) {
      result.error = 'API key format is invalid';
      return result;
    }

    // Check for common issues
    if (trimmedKey.includes(' ') || trimmedKey.includes('\n') || trimmedKey.includes('\t')) {
      result.error = 'API key contains invalid whitespace characters';
      return result;
    }

    result.isValid = true;
    result.details!.format = true;
    delete result.error;
    
    return result;
  }

  /**
   * Validate API key with live API verification
   */
  public async validateWithApi(
    apiKey: string,
    provider: keyof typeof this.defaultConfigs | ApiKeyConfig
  ): Promise<ApiKeyValidationResult> {
    const config = typeof provider === 'string' 
      ? this.defaultConfigs[provider] 
      : provider;

    if (!config) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    const keyHash = this.hashKey(apiKey);

    // Check throttling
    if (this.isThrottled(keyHash, config.throttleMs || 5000)) {
      return {
        isValid: false,
        error: 'Validation throttled. Please wait before trying again.',
        timestamp: Date.now()
      };
    }

    // Check cache
    const cached = this.getCachedResult(keyHash, config.cacheValidationMs || 300000);
    if (cached) {
      return cached;
    }

    // Prevent concurrent validations
    if (this.validationInProgress.has(keyHash)) {
      return {
        isValid: false,
        error: 'Validation already in progress',
        timestamp: Date.now()
      };
    }

    this.validationInProgress.add(keyHash);

    try {
      // Format validation first
      const formatResult = this.validateFormat(apiKey, config);
      if (!formatResult.isValid) {
        return formatResult;
      }

      // API validation
      const apiResult = await this.performApiValidation(apiKey, config);
      
      // Cache result
      this.cacheResult(keyHash, apiResult);
      
      // Update throttle state
      this.throttleState[keyHash] = Date.now();

      return apiResult;

    } finally {
      this.validationInProgress.delete(keyHash);
    }
  }

  /**
   * Get validation result from cache
   */
  public getCachedValidation(apiKey: string): ApiKeyValidationResult | null {
    const keyHash = this.hashKey(apiKey);
    const cached = this.cache[keyHash];
    
    if (!cached) return null;
    
    // Check if cache is still valid (default 5 minutes)
    if (Date.now() - cached.timestamp > 300000) {
      delete this.cache[keyHash];
      return null;
    }
    
    return cached.result;
  }

  /**
   * Clear validation cache
   */
  public clearCache(): void {
    this.cache = {};
    this.throttleState = {};
  }

  /**
   * Get validation statistics
   */
  public getStats() {
    const now = Date.now();
    const cacheEntries = Object.values(this.cache);
    
    return {
      cacheSize: cacheEntries.length,
      validCached: cacheEntries.filter(entry => entry.result.isValid).length,
      inProgress: this.validationInProgress.size,
      throttledKeys: Object.keys(this.throttleState).length,
      recentValidations: cacheEntries.filter(entry => 
        now - entry.timestamp < 60000 // Last minute
      ).length
    };
  }

  // Private methods
  private async performApiValidation(
    apiKey: string,
    config: ApiKeyConfig
  ): Promise<ApiKeyValidationResult> {
    const result: ApiKeyValidationResult = {
      isValid: false,
      timestamp: Date.now(),
      details: {
        format: true,
        connection: false,
        permissions: false
      }
    };

    try {
      const response = await this.makeTestRequest(apiKey, config);
      
      if (response.ok) {
        result.isValid = true;
        result.details!.connection = true;
        result.details!.permissions = true;
        
        // Extract quota information if available
        const remaining = response.headers.get('x-ratelimit-remaining');
        const resetTime = response.headers.get('x-ratelimit-reset');
        
        if (remaining && resetTime) {
          result.details!.quota = {
            remaining: parseInt(remaining),
            resetTime: parseInt(resetTime)
          };
        }
        
      } else {
        result.details!.connection = true; // We got a response
        
        if (response.status === 401) {
          result.error = 'Invalid API key - authentication failed';
        } else if (response.status === 403) {
          result.error = 'API key valid but insufficient permissions';
          result.details!.permissions = false;
        } else if (response.status === 429) {
          result.error = 'Rate limit exceeded';
        } else {
          result.error = `API validation failed: ${response.status} ${response.statusText}`;
        }
      }
      
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        result.error = 'Network error - unable to connect to API';
      } else {
        result.error = `Validation error: ${(error as Error).message}`;
      }
    }

    return result;
  }

  private async makeTestRequest(apiKey: string, config: ApiKeyConfig): Promise<Response> {
    const headers: Record<string, string> = {
      'User-Agent': 'LightUp-Extension/1.0'
    };

    // Set authorization header based on provider
    switch (config.provider) {
      case 'openai':
      case 'xai':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'gemini':
        // Gemini uses query parameter
        break;
      default:
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const url = config.provider === 'gemini' 
      ? `${config.endpoint}?key=${apiKey}`
      : config.endpoint!;

    return fetch(url, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
  }

  private isThrottled(keyHash: string, throttleMs: number): boolean {
    const lastValidation = this.throttleState[keyHash];
    if (!lastValidation) return false;
    
    return Date.now() - lastValidation < throttleMs;
  }

  private getCachedResult(keyHash: string, cacheMs: number): ApiKeyValidationResult | null {
    const cached = this.cache[keyHash];
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cacheMs) {
      delete this.cache[keyHash];
      return null;
    }
    
    return cached.result;
  }

  private cacheResult(keyHash: string, result: ApiKeyValidationResult): void {
    this.cache[keyHash] = {
      result,
      timestamp: Date.now()
    };
    
    // Cleanup old cache entries
    this.cleanupCache();
  }

  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = 600000; // 10 minutes
    
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > maxAge) {
        delete this.cache[key];
      }
    });
  }

  private hashKey(apiKey: string): string {
    // Simple hash for caching (not cryptographic)
    let hash = 0;
    for (let i = 0; i < apiKey.length; i++) {
      const char = apiKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
}

// Singleton instance for global use
export const apiKeyValidator = new ApiKeyValidator();

// Convenience methods for each provider
export const validateOpenAIKey = (apiKey: string) => 
  apiKeyValidator.validateWithApi(apiKey, 'openai');

export const validateGeminiKey = (apiKey: string) => 
  apiKeyValidator.validateWithApi(apiKey, 'gemini');

export const validateXAIKey = (apiKey: string) => 
  apiKeyValidator.validateWithApi(apiKey, 'xai'); 