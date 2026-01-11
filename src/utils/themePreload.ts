const THEME_STORAGE_KEY = "lightup-last-theme"

const getInitialTheme = (): "light" | "dark" => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as
      | "light"
      | "dark"
      | "system"
      | null

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

const applyInitialTheme = () => {
  if (typeof document === "undefined") {
    return
  }

  const initialTheme = getInitialTheme()
  document.documentElement.setAttribute("data-theme", initialTheme)
  document.documentElement.classList.add("no-transitions")

  requestAnimationFrame(() => {
    document.documentElement.classList.remove("no-transitions")
  })
}

applyInitialTheme()

export const rememberTheme = (theme: "light" | "dark" | "system") => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // ignore storage write errors
  }
}
