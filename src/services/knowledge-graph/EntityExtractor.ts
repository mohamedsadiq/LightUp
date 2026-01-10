import { v4 as uuidv4 } from "uuid"

import { unifiedAIService } from "~services/llm/UnifiedAIService"
import type {
  Entity,
  EntityExtractionResult,
  EntityType,
  ExtractionOptions
} from "~types/knowledge-graph"
import type { Settings } from "~types/settings"

export class EntityExtractor {
  private settings: Settings

  constructor(settings: Settings) {
    this.settings = settings
  }

  async extractFromText(
    text: string,
    options: ExtractionOptions = {
      minConfidence: 0.7,
      entityTypes: [
        "person",
        "organization",
        "tool",
        "concept",
        "location",
        "topic",
        "technology",
        "other"
      ],
      useLocalLLM: true,
      contextWindow: 5000
    }
  ): Promise<EntityExtractionResult> {
    if (options.useLocalLLM && this.canUseLocalLLM()) {
      return await this.extractWithLLM(text, options)
    } else {
      return await this.extractBasic(text, options)
    }
  }

  private canUseLocalLLM(): boolean {
    return this.settings.modelType === "local" || this.settings.serverUrl
  }

  private async extractWithLLM(
    text: string,
    options: ExtractionOptions
  ): Promise<EntityExtractionResult> {
    const systemPrompt = `You are an expert entity extraction system. Extract entities from the given text and identify relationships between them.

Output MUST be valid JSON only, no additional text.

Entity types: ${options.entityTypes.join(", ")}

Return format:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "entity_type",
      "confidence": 0.0-1.0,
      "aliases": ["alternative names"],
      "summary": "brief description"
    }
  ],
  "relationships": [
    {
      "from": "Entity A Name",
      "to": "Entity B Name",
      "type": "related-to|uses|mentions|part-of|created-by",
      "confidence": 0.0-1.0,
      "description": "relationship description"
    }
  ]
}

Rules:
- Extract all significant entities
- Identify clear relationships
- Confidence should reflect certainty
- Aliases include alternative spellings or names
- Summary should be 1-2 sentences
- Include technology names, tools, people, organizations
- Minimum confidence: ${options.minConfidence}`

    try {
      const result = await unifiedAIService.processText(
        {
          text,
          mode: "explain",
          settings: this.settings,
          id: uuidv4(),
          isFollowUp: false
        },
        systemPrompt,
        () => {}
      )

      if (result.error) {
        throw new Error(`LLM extraction failed: ${result.error}`)
      }

      const parsed = this.parseLLMResponse(result.result || "")

      return {
        entities: parsed.entities.filter(
          (e) => e.confidence >= options.minConfidence
        ),
        relationships: parsed.relationships.filter(
          (r) => r.confidence >= options.minConfidence
        )
      }
    } catch (error) {
      console.error("LLM extraction error, falling back to basic:", error)
      return await this.extractBasic(text, options)
    }
  }

  private parseLLMResponse(response: string): EntityExtractionResult {
    const jsonMatch = response.match(/\{[\s\S]*\}/)

    if (!jsonMatch) {
      console.warn("No JSON found in LLM response")
      return { entities: [], relationships: [] }
    }

    try {
      return JSON.parse(jsonMatch[0])
    } catch (error) {
      console.error("Failed to parse LLM JSON response:", error)
      return { entities: [], relationships: [] }
    }
  }

  private async extractBasic(
    text: string,
    options: ExtractionOptions
  ): Promise<EntityExtractionResult> {
    const entities: EntityExtractionResult["entities"] = []
    const relationships: EntityExtractionResult["relationships"] = []

    const patterns = {
      person: /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g,
      organization:
        /\b([A-Z][a-zA-Z]+ (Inc|Corp|LLC|Ltd|Foundation|Organization)\b|\b(Google|Microsoft|Apple|Amazon|Meta|OpenAI|xAI)\b/g,
      technology:
        /\b(React|TypeScript|JavaScript|Python|HTML|CSS|API|REST|GraphQL|Node\.js|Docker|Kubernetes)\b/gi,
      tool: /\b(Chrome|Firefox|VS Code|Git|GitHub|Stack Overflow|Docker|Postman|Figma|Slack)\b/gi,
      url: /https?:\/\/[^\s<]+/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    }

    const entityNames = new Set<string>()

    for (const [type, pattern] of Object.entries(patterns)) {
      let match
      const regex = new RegExp(pattern)

      while ((match = regex.exec(text)) !== null) {
        const name = match[1] || match[0]

        if (!entityNames.has(name)) {
          entityNames.add(name)

          entities.push({
            name,
            type: type as EntityType,
            confidence: 0.6,
            aliases: []
          })
        }
      }
    }

    return {
      entities: entities.filter((e) => options.entityTypes.includes(e.type)),
      relationships
    }
  }

  createEntity(
    name: string,
    type: EntityType,
    url: string,
    pageTitle: string,
    importance: number = 0.5
  ): Entity {
    const now = new Date()

    return {
      id: uuidv4(),
      name,
      type,
      contexts: [
        {
          url,
          domain: new URL(url).hostname,
          pageTitle,
          firstSeen: now,
          lastSeen: now,
          occurrenceCount: 1
        }
      ],
      importance,
      metadata: {
        created: now
      }
    }
  }

  updateEntityContext(entity: Entity, url: string, pageTitle: string): Entity {
    const domain = new URL(url).hostname
    const now = new Date()

    const existingContext = entity.contexts.find((c) => c.url === url)

    if (existingContext) {
      existingContext.lastSeen = now
      existingContext.occurrenceCount++
    } else {
      entity.contexts.push({
        url,
        domain,
        pageTitle,
        firstSeen: now,
        lastSeen: now,
        occurrenceCount: 1
      })
    }

    entity.importance = Math.min(1, entity.importance * 1.05)

    return entity
  }

  calculateImportance(entity: Entity, totalConversations: number): number {
    const frequencyScore = Math.min(
      1,
      entity.contexts.reduce((sum, ctx) => sum + ctx.occurrenceCount, 0) / 10
    )

    const diversityScore = Math.min(
      1,
      new Set(entity.contexts.map((c) => c.domain)).size / 5
    )

    const recencyScore = Math.max(0, 1 - entity.contexts.length / 50)

    const importance =
      frequencyScore * 0.4 + diversityScore * 0.4 + recencyScore * 0.2

    return importance
  }

  deduplicateEntities(entities: Entity[]): Entity[] {
    const entityMap = new Map<string, Entity>()

    for (const entity of entities) {
      const normalizedName = entity.name.toLowerCase().trim()

      if (entityMap.has(normalizedName)) {
        const existing = entityMap.get(normalizedName)!

        for (const context of entity.contexts) {
          const existingContext = existing.contexts.find(
            (c) => c.url === context.url
          )

          if (existingContext) {
            existingContext.occurrenceCount += context.occurrenceCount
          } else {
            existing.contexts.push(context)
          }
        }

        existing.importance = Math.max(existing.importance, entity.importance)

        if (entity.summary && !existing.summary) {
          existing.summary = entity.summary
        }

        if (entity.aliases) {
          existing.aliases = [
            ...new Set([...(existing.aliases || []), ...entity.aliases])
          ]
        }
      } else {
        entityMap.set(normalizedName, entity)
      }
    }

    return Array.from(entityMap.values())
  }
}
