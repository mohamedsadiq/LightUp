/**
 * Robust font loading utilities for LightUp extension
 * Handles cross-site compatibility and Shadow DOM font loading
 */

export interface FontLoadingOptions {
  timeout?: number;
  fallback?: string;
  forceReload?: boolean;
}

export interface FontStatus {
  loaded: boolean;
  error?: string;
  fallbackUsed: boolean;
}

/**
 * Font loading manager with comprehensive fallback system
 */
export class FontManager {
  private static instance: FontManager;
  private fontLoadPromises: Map<string, Promise<FontStatus>> = new Map();
  private loadedFonts: Set<string> = new Set();
  
  static getInstance(): FontManager {
    if (!FontManager.instance) {
      FontManager.instance = new FontManager();
    }
    return FontManager.instance;
  }

  /**
   * Load K2D font with comprehensive fallback system
   */
  async loadK2DFont(options: FontLoadingOptions = {}): Promise<FontStatus> {
    const {
      timeout = 5000,
      fallback = 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      forceReload = false
    } = options;

    if (!forceReload && this.loadedFonts.has('K2D')) {
      return { loaded: true, fallbackUsed: false };
    }

    // Use cached promise if loading is in progress
    const cacheKey = 'K2D';
    if (!forceReload && this.fontLoadPromises.has(cacheKey)) {
      return this.fontLoadPromises.get(cacheKey)!;
    }

    const loadPromise = this.loadFontWithFallback('K2D', timeout, fallback);
    this.fontLoadPromises.set(cacheKey, loadPromise);

    return loadPromise;
  }

  /**
   * Load font with timeout and fallback mechanisms
   */
  private async loadFontWithFallback(
    fontFamily: string,
    timeout: number,
    fallback: string
  ): Promise<FontStatus> {
    try {
      // Check if font is already available
      if (document.fonts && this.isFontAvailable(fontFamily)) {
        this.loadedFonts.add(fontFamily);
        return { loaded: true, fallbackUsed: false };
      }

      // Load font with timeout
      const fontLoaded = await Promise.race([
        this.loadFontFromDocument(fontFamily),
        this.createTimeoutPromise(timeout)
      ]);

      if (fontLoaded) {
        this.loadedFonts.add(fontFamily);
        return { loaded: true, fallbackUsed: false };
      } else {
        console.warn(`Font ${fontFamily} failed to load within ${timeout}ms, using fallback`);
        return { loaded: false, error: 'Timeout', fallbackUsed: true };
      }
    } catch (error) {
      console.error(`Font loading error for ${fontFamily}:`, error);
      return { 
        loaded: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: true 
      };
    }
  }

  /**
   * Check if font is available in the document
   */
  private isFontAvailable(fontFamily: string): boolean {
    if (!document.fonts) return false;
    
    // Check if font is already loaded
    const fontFace = Array.from(document.fonts).find(
      font => font.family.includes(fontFamily) && font.status === 'loaded'
    );
    
    return !!fontFace;
  }

  /**
   * Load font from document fonts API
   */
  private async loadFontFromDocument(fontFamily: string): Promise<boolean> {
    if (!document.fonts) {
      throw new Error('Font Loading API not supported');
    }

    try {
      // Wait for all fonts to be ready
      await document.fonts.ready;
      
      // Check if our font is loaded
      return this.isFontAvailable(fontFamily);
    } catch (error) {
      console.error('Document fonts loading failed:', error);
      return false;
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(false), timeout);
    });
  }

  /**
   * Get optimal font stack based on loading status
   */
  getFontStack(primaryFont: string = 'K2D'): string {
    const isLoaded = this.loadedFonts.has(primaryFont);
    
    if (isLoaded) {
      return `'${primaryFont}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
    }
    
    // Fallback stack with web-safe fonts
    return "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  }

  /**
   * Apply font styles with high specificity to overcome site CSS
   */
  applyFontStyles(element: HTMLElement, fontFamily?: string): void {
    const fontStack = fontFamily || this.getFontStack();
    
    // Apply with maximum specificity and !important
    element.style.setProperty('font-family', fontStack, 'important');
    
    // Additional CSS custom properties for inheritance
    element.style.setProperty('--lightup-font-family', fontStack);
  }

  /**
   * Inject font preload hints for better performance
   */
  injectFontPreloads(): void {
    const fonts = [
      'K2D-Regular.woff2',
      'K2D-Medium.woff2', 
      'K2D-SemiBold.woff2',
      'K2D-Bold.woff2'
    ];

    fonts.forEach(font => {
      const existingPreload = document.querySelector(`link[href*="${font}"]`);
      if (!existingPreload) {
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'font';
        preload.type = 'font/woff2';
        preload.crossOrigin = 'anonymous';
        preload.href = chrome.runtime.getURL(`assets/${font}`);
        document.head.appendChild(preload);
      }
    });
  }

  /**
   * Monitor font loading and apply fallbacks
   */
  monitorFontLoading(callback?: (status: FontStatus) => void): void {
    this.loadK2DFont().then(status => {
      if (callback) callback(status);
      
      if (!status.loaded) {
        console.log('LightUp: Font loading failed, fallback fonts will be used');
      }
    });
  }
}

/**
 * Global font manager instance
 */
export const fontManager = FontManager.getInstance();

/**
 * Utility function to get CSS-ready font family string
 */
export const getOptimalFontFamily = (): string => {
  return fontManager.getFontStack();
};

/**
 * Utility function to apply font to element with high specificity
 */
export const applyLightUpFont = (element: HTMLElement): void => {
  fontManager.applyFontStyles(element);
};

/**
 * Initialize font loading system
 */
export const initializeFontSystem = async (options?: FontLoadingOptions): Promise<FontStatus> => {
  // Inject preload hints for better performance
  fontManager.injectFontPreloads();
  
  // Load main font
  const status = await fontManager.loadK2DFont(options);
  
  // Set up monitoring
  fontManager.monitorFontLoading();
  
  return status;
};
