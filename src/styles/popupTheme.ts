/**
 * Shared theme system for popup and options pages
 * Supports light, dark, and system themes
 */

export interface PopupThemeColors {
  // Core colors
  background: string;
  foreground: string;
  
  // Sidebar
  sidebar: string;
  sidebarActive: string;
  sidebarText: string;
  sidebarTextActive: string;
  
  // Content area
  content: string;
  
  // Borders and dividers
  border: string;
  divider: string;
  
  // Buttons
  primary: string;
  primaryHover: string;
  destructive: string;
  destructiveHover: string;
  buttonDefault: string;
  buttonDefaultHover: string;
  buttonText: string;
  
  // Toggle
  toggleActive: string;
  toggleInactive: string;
  toggleTrack: string;
  
  // Cards
  card: string;
  cardHover: string;
  
  // Header
  header: string;
  
  // Text
  secondaryText: string;
  
  // Input
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
  
  // Select/Dropdown
  selectBackground: string;
  selectBorder: string;
  
  // Overlay
  overlayBackground: string;
  
  // Badges
  badgeBackground: string;
  badgeBorder: string;
}

export const darkTheme: PopupThemeColors = {
  // Core colors
  background: "#2A2A2A",
  foreground: "#FFFFFF",
  
  // Sidebar
  sidebar: "#2A2A2A",
  sidebarActive: "#ffffff0d",
  sidebarText: "rgba(255, 255, 255, 0.7)",
  sidebarTextActive: "#FFFFFF",
  
  // Content area
  content: "#2A2A2A",
  
  // Borders and dividers
  border: "#3A3A3A",
  divider: "#9d9d9d",
  
  // Buttons
  primary: "#0078D4",
  primaryHover: "#106EBE",
  destructive: "#E74C3C",
  destructiveHover: "#C0392B",
  buttonDefault: "#444444",
  buttonDefaultHover: "#505050",
  buttonText: "#FFFFFF",
  
  // Toggle
  toggleActive: "#2DCA6E",
  toggleInactive: "#6B6B6B",
  toggleTrack: "#333333",
  
  // Cards
  card: "#333333",
  cardHover: "#3a3a3a",
  
  // Header
  header: "#232323",
  
  // Text
  secondaryText: "rgba(255, 255, 255, 0.6)",
  
  // Input
  inputBackground: "#2A2A2A",
  inputBorder: "#3A3A3A",
  inputFocusBorder: "#0078D4",
  
  // Select/Dropdown
  selectBackground: "transparent",
  selectBorder: "#3A3A3A",
  
  // Overlay
  overlayBackground: "rgb(36 36 36 / 93%)",
  
  // Badges
  badgeBackground: "linear-gradient(135deg, rgb(56 56 56) 0%, rgb(33 33 33) 100%)",
  badgeBorder: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))"
};

export const lightTheme: PopupThemeColors = {
  // Core colors
  background: "#FFFFFF",
  foreground: "#1A1A1A",
  
  // Sidebar
  sidebar: "#F5F5F5",
  sidebarActive: "rgba(0, 0, 0, 0.06)",
  sidebarText: "rgba(0, 0, 0, 0.65)",
  sidebarTextActive: "#1A1A1A",
  
  // Content area
  content: "#FFFFFF",
  
  // Borders and dividers
  border: "#E0E0E0",
  divider: "#D0D0D0",
  
  // Buttons
  primary: "#0078D4",
  primaryHover: "#106EBE",
  destructive: "#E74C3C",
  destructiveHover: "#C0392B",
  buttonDefault: "#E8E8E8",
  buttonDefaultHover: "#D8D8D8",
  buttonText: "#1A1A1A",
  
  // Toggle
  toggleActive: "#2DCA6E",
  toggleInactive: "#B0B0B0",
  toggleTrack: "#D0D0D0",
  
  // Cards
  card: "#F0F0F0",
  cardHover: "#E8E8E8",
  
  // Header
  header: "#F5F5F5",
  
  // Text
  secondaryText: "rgba(0, 0, 0, 0.55)",
  
  // Input
  inputBackground: "#FFFFFF",
  inputBorder: "#D0D0D0",
  inputFocusBorder: "#0078D4",
  
  // Select/Dropdown
  selectBackground: "#FFFFFF",
  selectBorder: "#D0D0D0",
  
  // Overlay
  overlayBackground: "rgba(255, 255, 255, 0.95)",
  
  // Badges
  badgeBackground: "linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)",
  badgeBorder: "linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.05))"
};

export type ThemeMode = "light" | "dark" | "system";

/**
 * Get the effective theme based on setting and system preference
 */
export const getEffectiveTheme = (themeSetting: ThemeMode): "light" | "dark" => {
  if (themeSetting === "system") {
    // Check system preference
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark"; // Default to dark if we can't detect
  }
  return themeSetting;
};

/**
 * Get theme colors based on effective theme
 */
export const getThemeColors = (effectiveTheme: "light" | "dark"): PopupThemeColors => {
  return effectiveTheme === "light" ? lightTheme : darkTheme;
};

/**
 * CSS-in-JS helper for creating theme-aware styles
 */
export const createThemedStyles = (theme: PopupThemeColors) => ({
  // Helper methods for common patterns
  getHoverBackground: (baseColor: string, hoverColor: string) => `
    background: ${baseColor};
    transition: background 0.2s ease;
    &:hover {
      background: ${hoverColor};
    }
  `,
  
  // Get color with opacity
  withOpacity: (color: string, opacity: number): string => {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // Return as-is for other formats
    return color;
  }
});
