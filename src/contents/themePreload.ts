/**
 * Content script that runs at document_start to set theme before any rendering
 * This prevents the initial dark flash when opening popup/options pages
 */

import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  run_at: "document_start"
}

const THEME_STORAGE_KEY = "lightup-last-theme"

const getInitialTheme = (): "light" | "dark" => {
  try {
    const storedTheme = localStorage.getItem(
      THEME_STORAGE_KEY
    ) as "light" | "dark" | "system" | null

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme
    }

    if (storedTheme === "system") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
  } catch {
    // ignore and fallback
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

// Set theme immediately before any rendering
const initialTheme = getInitialTheme()
document.documentElement.setAttribute("data-theme", initialTheme)
