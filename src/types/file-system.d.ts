declare global {
  interface Window {
    showOpenFilePicker(options?: {
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
      multiple?: boolean
      excludeAcceptAllOption?: boolean
      id?: string
      startIn?:
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos"
    }): Promise<FileSystemFileHandle[]>

    showSaveFilePicker(options?: {
      suggestedName?: string
      types?: Array<{
        description?: string
        accept: Record<string, string[]>
      }>
      excludeAcceptAllOption?: boolean
      id?: string
      startIn?:
        | "desktop"
        | "documents"
        | "downloads"
        | "music"
        | "pictures"
        | "videos"
    }): Promise<FileSystemFileHandle>
  }

  interface FileSystemFileHandle {
    getFile(): Promise<File>
    createWritable(options?: {
      keepExistingData?: boolean
    }): Promise<FileSystemWritableFileStream>
    requestPermission(options?: {
      mode?: "read" | "readwrite"
    }): Promise<boolean>
    queryPermission(options?: { mode?: "read" | "readwrite" }): Promise<boolean>
    isSameEntry(other: FileSystemFileHandle): Promise<boolean>
  }

  interface FileSystemWritableFileStream extends WritableStream {
    write(data: string | BufferSource | Blob): Promise<void>
    seek(position: number): Promise<void>
    truncate(size: number): Promise<void>
  }

  type PermissionState = "granted" | "denied" | "prompt"
}

export {}
