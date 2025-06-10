/**
 * Utility functions for getting website information
 */

export interface WebsiteInfo {
  title: string;
  favicon: string;
  hostname: string;
}

/**
 * Get the favicon URL for the current website
 * @returns Promise<string> - The favicon URL
 */
export const getFaviconUrl = (): string => {
  // Try to get the favicon from various possible sources
  const favicon = 
    document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ||
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href ||
    document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.href ||
    document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon-precomposed"]')?.href ||
    // Try common favicon paths
    `${window.location.protocol}//${window.location.hostname}/favicon.ico`;

  // Ensure we have a valid URL
  try {
    new URL(favicon);
    return favicon;
  } catch {
    // Fallback to default favicon location
    return `${window.location.protocol}//${window.location.hostname}/favicon.ico`;
  }
};

/**
 * Get the page title
 * @returns string - The page title
 */
export const getPageTitle = (): string => {
  return document.title || window.location.hostname;
};

/**
 * Get the website hostname
 * @returns string - The hostname
 */
export const getHostname = (): string => {
  return window.location.hostname;
};

/**
 * Get comprehensive website information
 * @returns WebsiteInfo - Object containing title, favicon, and hostname
 */
export const getWebsiteInfo = (): WebsiteInfo => {
  return {
    title: getPageTitle(),
    favicon: getFaviconUrl(),
    hostname: getHostname()
  };
};

/**
 * Check if a favicon URL is valid by attempting to load it
 * @param url - The favicon URL to check
 * @returns Promise<boolean> - Whether the favicon is valid
 */
export const isValidFavicon = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    
    // Timeout after 3 seconds
    setTimeout(() => resolve(false), 3000);
  });
}; 