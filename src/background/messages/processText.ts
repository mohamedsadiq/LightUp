import type { PlasmoMessaging } from "@plasmohq/messaging"
import { Storage } from "@plasmohq/storage"
import { processLocalText } from "~services/llm/local"
import { processOpenAIText } from "~services/llm/openai"
import type { ProcessTextRequest } from "~types/messages"

const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  const port = chrome.runtime.connect({ name: "text-processing" });
  
  try {
    const { text, mode } = req.body
  

    if (!['explain', 'summarize', 'analyze', 'translate'].includes(mode)) {
      res.send({ error: `Invalid mode: ${mode}` })
      return
    }

    const storage = new Storage()
    const settings = (await storage.get("settings")) || { modelType: "openai", maxTokens: 2048 }
    
    const normalizedSettings = typeof settings === 'string' 
      ? { modelType: "openai" as const, maxTokens: 2048 } 
      : { ...settings, modelType: settings.modelType as "local" | "openai" }
    
    port.postMessage({
      type: "PROCESS_TEXT",
      payload: {
        text,
        mode,
        settings: normalizedSettings,
        stream: true
      }
    });

    res.send({ processing: true });

  } catch (error) {
    console.error('Error:', error)
    res.send({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    })
  }
}

export default handler 