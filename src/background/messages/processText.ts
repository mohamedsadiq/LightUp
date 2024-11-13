import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { processLocalText } from "~services/llm/local"
import { processOpenAIText } from "~services/llm/openai"
import type { ProcessTextRequest, ProcessTextResponse } from "~types/messages"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  try {
    const { text, mode } = req.body
    console.log('Processing text in mode:', mode)

    const storage = new Storage()
    const settings = (await storage.get("settings")) || { modelType: "openai", maxTokens: 2048 }
    
    const normalizedSettings = typeof settings === 'string' 
      ? { modelType: "openai" as const, maxTokens: 2048 } 
      : { ...settings, modelType: settings.modelType as "local" | "openai" }
    
    const modelType = normalizedSettings.modelType as "local" | "openai"
    
    const response = modelType === "local" 
      ? await processLocalText({ text, mode, maxTokens: normalizedSettings.maxTokens, settings: normalizedSettings })
      : await processOpenAIText({ text, mode, maxTokens: normalizedSettings.maxTokens, settings: normalizedSettings })

    res.send({
      result: response
    })
  } catch (error) {
    console.error('Error:', error)
    res.send({
      error: error.message
    })
  }
}

export default handler 