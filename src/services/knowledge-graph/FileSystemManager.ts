import type { FileSystemManagerConfig } from "~types/knowledge-graph"

export class FileSystemManager {
  private fileHandle: FileSystemFileHandle | null = null
  private config: FileSystemManagerConfig
  private autoSaveTimer: NodeJS.Timeout | null = null

  constructor(config: FileSystemManagerConfig) {
    this.config = config
  }

  async openFilePicker(): Promise<FileSystemFileHandle> {
    try {
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "Markdown Files",
            accept: {
              "text/markdown": [".md"],
              "text/plain": [".txt"]
            }
          }
        ],
        multiple: false,
        startIn: this.config.startIn || "documents"
      })

      this.fileHandle = fileHandle
      return fileHandle
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("User cancelled file selection")
      }
      throw error
    }
  }

  async saveFilePicker(): Promise<FileSystemFileHandle> {
    try {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName:
          this.config.suggestedName || "LightUp-Knowledge-Graph.md",
        types: [
          {
            description: "Markdown Files",
            accept: {
              "text/markdown": [".md"],
              "text/plain": [".txt"]
            }
          }
        ],
        startIn: this.config.startIn || "documents"
      })

      this.fileHandle = fileHandle
      await this.enableAutoSave()
      return fileHandle
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("User cancelled file selection")
      }
      throw error
    }
  }

  async readFile(): Promise<string> {
    if (!this.fileHandle) {
      throw new Error("No file handle available")
    }

    const file = await this.fileHandle.getFile()
    return await file.text()
  }

  async writeFile(content: string): Promise<void> {
    if (!this.fileHandle) {
      throw new Error("No file handle available")
    }

    const writable = await this.fileHandle.createWritable()
    await writable.write(content)
    await writable.close()
  }

  async enableAutoSave(): Promise<void> {
    if (this.config.autoSave && this.autoSaveTimer === null) {
      this.autoSaveTimer = setInterval(() => {
        window.dispatchEvent(new CustomEvent("pkg-auto-save-request"))
      }, this.config.autoSaveInterval)
    }
  }

  disableAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }

  hasFileHandle(): boolean {
    return this.fileHandle !== null
  }

  async getFileInfo(): Promise<{
    name: string
    size: number
    lastModified: number
  } | null> {
    if (!this.fileHandle) return null

    const file = await this.fileHandle.getFile()
    return {
      name: file.name,
      size: file.size,
      lastModified: file.lastModified
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.fileHandle) return false

    const permission = await this.fileHandle.requestPermission({
      mode: "readwrite" as const
    })
    return permission
  }

  async checkPermission(): Promise<boolean> {
    if (!this.fileHandle) return false

    const permission = await this.fileHandle.queryPermission({
      mode: "readwrite"
    })
    return permission
  }

  async close(): Promise<void> {
    this.disableAutoSave()
    this.fileHandle = null
  }
}
