/**
 * Hook for managing popup/options page theme
 * Reads theme from settings and provides theme colors
 */

import { useState, useEffect } from "react";
import { Storage } from "@plasmohq/storage";
import {
    getEffectiveTheme,
    getThemeColors,
    darkTheme,
    type PopupThemeColors,
    type ThemeMode
} from "~styles/popupTheme";

interface UsePopupThemeReturn {
    theme: PopupThemeColors;
    effectiveTheme: "light" | "dark";
    themeSetting: ThemeMode;
    isLoading: boolean;
}

export const usePopupTheme = (): UsePopupThemeReturn => {
    const [themeSetting, setThemeSetting] = useState<ThemeMode>("dark");
    const [isLoading, setIsLoading] = useState(true);

    // Compute effective theme
    const effectiveTheme = getEffectiveTheme(themeSetting);
    const theme = getThemeColors(effectiveTheme);

    useEffect(() => {
        const storage = new Storage();

        // Load initial theme setting
        const loadTheme = async () => {
            try {
                const settings = await storage.get("settings");
                if (settings?.customization?.theme) {
                    setThemeSetting(settings.customization.theme as ThemeMode);
                }
            } catch (error) {
                console.error("Error loading theme setting:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTheme();

        // Listen for settings changes
        const handleSettingsUpdate = (event: CustomEvent) => {
            const newSettings = event.detail?.settings;
            if (newSettings?.customization?.theme) {
                setThemeSetting(newSettings.customization.theme as ThemeMode);
            }
        };

        window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);

        // Also watch storage changes
        const watchStorage = async () => {
            const unwatch = await storage.watch({
                settings: (newValue) => {
                    if (newValue?.customization?.theme) {
                        setThemeSetting(newValue.customization.theme as ThemeMode);
                    }
                }
            });
            return unwatch;
        };

        const unwatchPromise = watchStorage();

        return () => {
            window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
            unwatchPromise.then(unwatch => unwatch?.());
        };
    }, []);

    // Listen for system theme changes when in system mode
    useEffect(() => {
        if (themeSetting !== "system") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            // Force re-render by updating state
            setThemeSetting(prev => prev); // This triggers a re-computation of effectiveTheme
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [themeSetting]);

    return {
        theme,
        effectiveTheme,
        themeSetting,
        isLoading
    };
};

// Export a default theme for SSR/initial render to prevent flash
export const defaultTheme = darkTheme;
