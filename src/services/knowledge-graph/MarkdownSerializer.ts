import { v4 as uuidv4 } from "uuid"

import type {
  Conversation,
  Entity,
  EntityType,
  KnowledgeGraph,
  Relationship,
  RelationshipType
} from "~types/knowledge-graph"

export class MarkdownSerializer {
  private static readonly VERSION = "1.0.0"

  static serialize(graph: KnowledgeGraph): string {
    const lines: string[] = []

    lines.push("# LightUp Personal Knowledge Graph")
    lines.push("")
    lines.push(`Version: ${this.VERSION}`)
    lines.push(`Created: ${graph.metadata.created.toISOString()}`)
    lines.push(`Last Updated: ${graph.metadata.lastUpdated.toISOString()}`)
    lines.push(`Total Entities: ${graph.metadata.totalEntities}`)
    lines.push(`Total Relationships: ${graph.metadata.totalRelationships}`)
    lines.push(`Total Conversations: ${graph.metadata.totalConversations}`)
    lines.push("")
    lines.push("---")
    lines.push("")

    lines.push("## Entities")
    lines.push("")

    const entitiesByType = this.groupEntitiesByType(graph.entities)

    for (const [type, entities] of entitiesByType) {
      lines.push(`### ${this.capitalizeFirst(type)}`)
      lines.push("")

      for (const entity of entities) {
        lines.push(this.serializeEntity(entity))
        lines.push("")
        lines.push("---")
        lines.push("")
      }
    }

    lines.push("## Relationships")
    lines.push("")

    const relationshipsByType = this.groupRelationshipsByType(
      graph.relationships
    )

    for (const [type, relationships] of relationshipsByType) {
      lines.push(`### ${this.formatRelationshipType(type)}`)
      lines.push("")

      for (const relationship of relationships) {
        lines.push(this.serializeRelationship(relationship, graph.entities))
        lines.push("")
        lines.push("---")
        lines.push("")
      }
    }

    lines.push("## Conversations")
    lines.push("")

    const conversationsByDate = [...graph.conversations].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    )

    for (const conversation of conversationsByDate) {
      lines.push(this.serializeConversation(conversation))
      lines.push("")
      lines.push("---")
      lines.push("")
    }

    lines.push("## Metadata")
    lines.push("")
    lines.push("```json")
    lines.push(JSON.stringify(graph.metadata, null, 2))
    lines.push("```")

    return lines.join("\n")
  }

  static deserialize(markdown: string): KnowledgeGraph {
    const graph: KnowledgeGraph = {
      version: this.VERSION,
      entities: [],
      relationships: [],
      conversations: [],
      metadata: {
        version: this.VERSION,
        created: new Date(),
        lastUpdated: new Date(),
        totalEntities: 0,
        totalRelationships: 0,
        totalConversations: 0,
        storageLocation: ""
      }
    }

    const lines = markdown.split("\n")
    let currentSection: string | null = null
    let currentEntityType: EntityType | null = null
    let currentRelationshipType: RelationshipType | null = null
    let currentEntity: Partial<Entity> | null = null
    let currentRelationship: Partial<Relationship> | null = null
    let currentConversation: Partial<Conversation> | null = null
    let buffer: string[] = []

    const entityMap = new Map<string, Entity>()

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (line.startsWith("## ")) {
        currentSection = line.replace("## ", "").toLowerCase()
        currentEntityType = null
        currentRelationshipType = null
        currentEntity = null
        currentRelationship = null
        currentConversation = null
        continue
      }

      if (line.startsWith("### ")) {
        const header = line.replace("### ", "")

        if (currentSection === "entities") {
          currentEntityType = header.toLowerCase() as EntityType
        } else if (currentSection === "relationships") {
          currentRelationshipType = this.parseRelationshipType(header)
        }
        continue
      }

      if (line.startsWith("**") && line.endsWith("**")) {
        const key = line.replace(/\*\*/g, "")
        const nextLine = lines[i + 1]
        const value = nextLine?.startsWith(": ") ? nextLine.substring(2) : ""

        if (currentEntity) {
          this.parseEntityField(currentEntity, key, value)
        } else if (currentRelationship) {
          this.parseRelationshipField(currentRelationship, key, value)
        } else if (currentConversation) {
          this.parseConversationField(currentConversation, key, value)
        }
        continue
      }

      if (line.startsWith("```json") || line.startsWith("```")) {
        const jsonStart = i + 1
        let jsonEnd = i + 1
        while (jsonEnd < lines.length && !lines[jsonEnd].startsWith("```")) {
          jsonEnd++
        }
        const jsonContent = lines.slice(jsonStart, jsonEnd).join("\n")

        try {
          if (currentSection === "metadata") {
            graph.metadata = JSON.parse(jsonContent)
          } else if (currentEntity && line.includes("Metadata")) {
            currentEntity.metadata = JSON.parse(jsonContent)
          }
        } catch (error) {
          console.error("Failed to parse JSON:", error)
        }

        i = jsonEnd
        continue
      }

      if (line.startsWith("- **") || line.startsWith("**")) {
        buffer.push(line)
      }
    }

    graph.entities.forEach((entity) => entityMap.set(entity.id, entity))

    return graph
  }

  private static serializeEntity(entity: Entity): string {
    const lines: string[] = []

    lines.push(`#### UUID: ${entity.id}`)
    lines.push(`**Name**: ${entity.name}`)

    if (entity.aliases && entity.aliases.length > 0) {
      lines.push(`**Aliases**: ${JSON.stringify(entity.aliases)}`)
    }

    lines.push(`**Importance**: ${entity.importance.toFixed(2)}`)

    if (entity.contexts.length > 0) {
      lines.push("")
      lines.push("**Contexts**:")
      for (const context of entity.contexts) {
        lines.push(`- [${context.domain}](${context.url})`)
        lines.push(`  - First Seen: ${context.firstSeen.toISOString()}`)
        lines.push(`  - Last Seen: ${context.lastSeen.toISOString()}`)
        if (context.pageTitle) {
          lines.push(`  - Page: "${context.pageTitle}"`)
        }
        lines.push(`  - Occurrences: ${context.occurrenceCount}`)
        lines.push("")
      }
    }

    if (entity.summary) {
      lines.push("")
      lines.push(`**Summary**: ${entity.summary}`)
    }

    if (entity.metadata) {
      lines.push("")
      lines.push("**Metadata**:")
      lines.push("```json")
      lines.push(JSON.stringify(entity.metadata, null, 2))
      lines.push("```")
    }

    return lines.join("\n")
  }

  private static serializeRelationship(
    relationship: Relationship,
    entities: Entity[]
  ): string {
    const lines: string[] = []
    const fromEntity = entities.find((e) => e.id === relationship.from)
    const toEntity = entities.find((e) => e.id === relationship.to)

    lines.push(`#### UUID: ${relationship.id}`)
    lines.push(`**From**: ${fromEntity?.name || relationship.from}`)
    lines.push(`**To**: ${toEntity?.name || relationship.to}`)
    lines.push(`**Strength**: ${relationship.strength.toFixed(2)}`)
    lines.push(`**First Seen**: ${relationship.firstSeen.toISOString()}`)
    lines.push(`**Last Seen**: ${relationship.lastSeen.toISOString()}`)

    if (relationship.sources.length > 0) {
      lines.push("")
      lines.push("**Sources**:")
      for (const source of relationship.sources) {
        lines.push(`- [${new URL(source).hostname}](${source})`)
      }
    }

    if (relationship.description) {
      lines.push("")
      lines.push(`**Description**: ${relationship.description}`)
    }

    return lines.join("\n")
  }

  private static serializeConversation(conversation: Conversation): string {
    const lines: string[] = []
    const date = new Date(conversation.timestamp)

    lines.push(
      `### ${date.toISOString().split("T")[0]} - ${conversation.domain}`
    )
    lines.push("")
    lines.push(`**ID**: ${conversation.id}`)
    lines.push(`**Mode**: ${conversation.mode}`)
    lines.push(`**Page**: [${conversation.domain}](${conversation.pageUrl})`)
    lines.push(`**Page Title**: "${conversation.pageTitle}"`)
    lines.push("")

    lines.push("**User Message**:")
    lines.push(`> ${this.escapeMarkdown(conversation.userMessage)}`)
    lines.push("")

    lines.push("**Assistant Response**:")
    const responseLines = conversation.assistantResponse.split("\n")
    for (const line of responseLines) {
      lines.push(`> ${this.escapeMarkdown(line)}`)
    }
    lines.push("")

    if (conversation.entities.length > 0) {
      lines.push("**Entities**: " + conversation.entities.join(", "))
    }

    if (conversation.crossSiteReferences.length > 0) {
      lines.push("")
      lines.push("**Cross-Site References**:")
      for (const ref of conversation.crossSiteReferences) {
        lines.push(
          `- **${ref.entityName}** - [${new URL(ref.sourceUrl).hostname}](${ref.sourceUrl})`
        )
        lines.push(`  - Summary: "${ref.summary}"`)
        lines.push(
          `  - Context: You've been reading about ${ref.entityName} recently`
        )
      }
    }

    return lines.join("\n")
  }

  private static groupEntitiesByType(
    entities: Entity[]
  ): Map<EntityType, Entity[]> {
    const groups = new Map<EntityType, Entity[]>()

    for (const entity of entities) {
      if (!groups.has(entity.type)) {
        groups.set(entity.type, [])
      }
      groups.get(entity.type)!.push(entity)
    }

    return groups
  }

  private static groupRelationshipsByType(
    relationships: Relationship[]
  ): Map<RelationshipType, Relationship[]> {
    const groups = new Map<RelationshipType, Relationship[]>()

    for (const rel of relationships) {
      if (!groups.has(rel.type)) {
        groups.set(rel.type, [])
      }
      groups.get(rel.type)!.push(rel)
    }

    return groups
  }

  private static parseEntityField(
    entity: Partial<Entity>,
    key: string,
    value: string
  ): void {
    switch (key.toLowerCase()) {
      case "uuid":
        entity.id = value
        break
      case "name":
        entity.name = value
        break
      case "importance":
        entity.importance = parseFloat(value)
        break
      case "aliases":
        try {
          entity.aliases = JSON.parse(value)
        } catch {
          entity.aliases = value.split(",").map((s) => s.trim())
        }
        break
      case "summary":
        entity.summary = value
        break
    }
  }

  private static parseRelationshipField(
    relationship: Partial<Relationship>,
    key: string,
    value: string
  ): void {
    switch (key.toLowerCase()) {
      case "uuid":
        relationship.id = value
        break
      case "from":
        relationship.from = value
        break
      case "to":
        relationship.to = value
        break
      case "strength":
        relationship.strength = parseFloat(value)
        break
      case "first seen":
        relationship.firstSeen = new Date(value)
        break
      case "last seen":
        relationship.lastSeen = new Date(value)
        break
      case "description":
        relationship.description = value
        break
    }
  }

  private static parseConversationField(
    conversation: Partial<Conversation>,
    key: string,
    value: string
  ): void {
    switch (key.toLowerCase()) {
      case "id":
        conversation.id = value
        break
      case "mode":
        conversation.mode = value as any
        break
      case "page":
        const urlMatch = value.match(/\]\(([^)]+)\)/)
        if (urlMatch) {
          conversation.pageUrl = urlMatch[1]
        }
        break
      case "page title":
        conversation.pageTitle = value.replace(/"/g, "")
        break
      case "entities":
        conversation.entities = value.split(", ").map((e) => e.trim())
        break
    }
  }

  private static parseRelationshipType(header: string): RelationshipType {
    const typeMap: Record<string, RelationshipType> = {
      "Related To": "related-to",
      Uses: "uses",
      Mentions: "mentions",
      "Located In": "located-in",
      "Part Of": "part-of",
      "Created By": "created-by",
      "Referenced By": "referenced-by"
    }

    return typeMap[header] || "related-to"
  }

  private static formatRelationshipType(type: RelationshipType): string {
    const typeMap: Record<RelationshipType, string> = {
      "related-to": "Related To",
      uses: "Uses",
      mentions: "Mentions",
      "located-in": "Located In",
      "part-of": "Part Of",
      "created-by": "Created By",
      "referenced-by": "Referenced By"
    }

    return typeMap[type] || type
  }

  private static capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  private static escapeMarkdown(text: string): string {
    return text
      .replace(/_/g, "\\_")
      .replace(/\*/g, "\\*")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
  }
}
