// Entity Types
export type EntityType =
  | "person"
  | "organization"
  | "tool"
  | "concept"
  | "location"
  | "topic"
  | "technology"
  | "other"

export type RelationshipType =
  | "related-to"
  | "uses"
  | "mentions"
  | "located-in"
  | "part-of"
  | "created-by"
  | "referenced-by"

export interface EntityContext {
  url: string
  domain: string
  pageTitle?: string
  firstSeen: Date
  lastSeen: Date
  occurrenceCount: number
}

export interface Entity {
  id: string
  name: string
  type: EntityType
  aliases?: string[]
  contexts: EntityContext[]
  summary?: string
  importance: number
  metadata?: Record<string, any>
}

export interface Relationship {
  id: string
  from: string
  to: string
  type: RelationshipType
  strength: number
  sources: string[]
  firstSeen: Date
  lastSeen: Date
  description?: string
}

export interface CrossSiteReference {
  entityName: string
  sourceUrl: string
  sourcePageTitle: string
  summary: string
}

export interface Conversation {
  id: string
  domain: string
  pageUrl: string
  pageTitle: string
  mode: "explain" | "summarize" | "analyze" | "translate" | "free"
  timestamp: Date
  userMessage: string
  assistantResponse: string
  entities: string[]
  relatedEntities: string[]
  crossSiteReferences: CrossSiteReference[]
}

export interface KnowledgeGraphMetadata {
  version: string
  created: Date
  lastUpdated: Date
  totalEntities: number
  totalRelationships: number
  totalConversations: number
  storageLocation: string
}

export interface KnowledgeGraph {
  version: string
  entities: Entity[]
  relationships: Relationship[]
  conversations: Conversation[]
  metadata: KnowledgeGraphMetadata
}

export interface KnowledgeGraphSettings {
  enabled: boolean
  filePath: string
  autoSave: boolean
  autoExtraction: boolean
  retentionPeriod: "session" | "7days" | "30days" | "forever"
  maxEntities: number
  excludeDomains: string[]
  privacyMode: "local-only" | "encrypted"
}

export interface ExtractionOptions {
  minConfidence: number
  entityTypes: EntityType[]
  useLocalLLM: boolean
  contextWindow: number
}

export interface GraphContext {
  entities: Entity[]
  relationships: Relationship[]
  relatedConversations: Conversation[]
  suggestions: {
    entityName: string
    relevance: number
    sourceUrl: string
  }[]
}

export interface FileSystemManagerConfig {
  startIn?: "desktop" | "documents" | "downloads"
  suggestedName?: string
  autoSave: boolean
  autoSaveInterval: number
}

export interface EntityExtractionResult {
  entities: {
    name: string
    type: EntityType
    confidence: number
    aliases?: string[]
  }[]
  relationships: {
    from: string
    to: string
    type: RelationshipType
    confidence: number
  }[]
}
