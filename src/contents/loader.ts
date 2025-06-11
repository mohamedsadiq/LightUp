import type { PlasmoCSConfig } from "plasmo"
import { Storage } from "@plasmohq/storage"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

let uiLoaded = false

const loadUI = async () => {
  if (uiLoaded) return
  uiLoaded = true
  try {
    const mod = await import("./index")
    if (typeof mod.mountLightUp === "function") {
      mod.mountLightUp()
    }
  } catch (err) {
    console.error("LightUp: failed to load UI", err)
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "LOAD_LIGHTUP_UI") {
    loadUI()
  }
})

// Auto-activation based on settings
;(async () => {
  try {
    const storage = new Storage()
    const settings = (await storage.get("settings")) as any
    if (settings?.customization?.automaticActivation) {
      loadUI()
    }
  } catch (e) {
    console.warn("LightUp loader: unable to read settings", e)
  }
})() 