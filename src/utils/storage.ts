import { Storage } from "@plasmohq/storage"
import type { Settings } from "~types/settings"

export const storage = new Storage()

export const getSettings = async (): Promise<Settings> => {
  const settings = await storage.get<Settings>("settings")
  return settings || {
    modelType: "local",
    maxTokens: 1000
  }
}

export const verifyServerConnection = async (serverUrl: string): Promise<boolean> => {
  try {
    console.log('Verifying server connection...')
    const response = await fetch(`${serverUrl}/v1/models`)
    const data = await response.json()
    console.log('Available models:', data)
    return true
  } catch (error) {
    console.error('Server connection failed:', error)
    return false
  }
} 