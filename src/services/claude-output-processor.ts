/**
 * Claude Output Processor
 * Handles structured output from Claude Code and processes it for embedding generation
 * and storage in Qdrant vector database
 */

import { QdrantClient } from '@qdrant/js-client-rest';
import { v4 as uuidv4 } from 'uuid';
import {
  ClaudeDocOutput,
  ClaudeDocSection,
  ProcessedDocument,
  IngestionResult,
  CodeExample
} from '../types/claude-ingestion.js';
import {
  generateEmbedding,
  EmbeddingProvider,
  getCollectionName,
  EMBEDDING_CONFIGS
} from './hybrid-embeddings.js';
import { logger } from '../utils/logger.js';

export class ClaudeOutputProcessor {
  private qdrantClient: QdrantClient;
  private defaultProvider: EmbeddingProvider;

  constructor(qdrantClient: QdrantClient, defaultProvider: EmbeddingProvider = 'ollama') {
    this.qdrantClient = qdrantClient;
    this.defaultProvider = defaultProvider;
  }

  /**
   * Process Claude's structured output into documents ready for embedding
   */
  async processClaudeOutput(
    output: ClaudeDocOutput,
    provider: EmbeddingProvider = this.defaultProvider
  ): Promise<IngestionResult> {
    const startTime = Date.now();
    const result: IngestionResult = {
      success: false,
      documentsProcessed: 0,
      embeddingsGenerated: 0,
      stats: {
        totalSections: 0,
        totalCodeExamples: 0,
        totalConcepts: 0,
        processingTimeMs: 0
      }
    };

    try {
      // Process each section into documents
      const documents = this.extractDocuments(output);
      result.stats.totalSections = output.sections.length;
      result.stats.totalCodeExamples = output.sections.reduce(
        (sum, section) => sum + (section.codeExamples?.length || 0),
        0
      );
      result.stats.totalConcepts = output.sections.reduce(
        (sum, section) => sum + (section.keyConcepts?.length || 0),
        0
      );

      // Generate embeddings and store
      const collectionName = getCollectionName(provider);
      await this.ensureCollection(collectionName, provider);

      const points = [];
      for (const doc of documents) {
        try {
          const embedding = await generateEmbedding(doc.content, provider);

          // Extract searchKeywords and aliases from the corresponding section
          const sourceSection = output.sections.find(s => s.title === doc.metadata.section);

          points.push({
            id: doc.id,
            vector: embedding,
            payload: {
              content: doc.content,
              title: doc.title,
              section: doc.metadata.section,
              url: doc.source,
              codeExamples: doc.metadata.codeExamples,
              keyConcepts: doc.metadata.keyConcepts,
              searchKeywords: sourceSection?.searchKeywords || [],
              aliases: sourceSection?.aliases || [],
              provider: provider,
              lastUpdated: doc.metadata.lastUpdated,
              extractionMethod: 'claude-driven',
              pageTitle: output.pageTitle,
              summary: output.summary
            }
          });

          result.embeddingsGenerated++;
        } catch (error: any) {
          logger.error(`Error generating embedding for document ${doc.id}:`, error);
          if (!result.errors) result.errors = [];
          result.errors.push(`Embedding generation failed for ${doc.title}: ${error.message}`);
        }
      }

      // Batch upsert to Qdrant
      if (points.length > 0) {
        await this.qdrantClient.upsert(collectionName, {
          points,
          wait: true
        });
        result.documentsProcessed = points.length;
        result.success = true;
      }

      result.stats.processingTimeMs = Date.now() - startTime;
      logger.info(
        `Processed ${result.documentsProcessed} documents in ${result.stats.processingTimeMs}ms`
      );
    } catch (error: any) {
      logger.error('Error processing Claude output:', error);
      result.errors = [error.message];
    }

    return result;
  }

  /**
   * Extract individual documents from Claude's structured output
   */
  private extractDocuments(output: ClaudeDocOutput): ProcessedDocument[] {
    const documents: ProcessedDocument[] = [];

    // Create a main document for the page summary
    if (output.summary) {
      documents.push({
        id: uuidv4(),
        source: output.source,
        title: output.pageTitle,
        content: this.formatMainContent(output),
        metadata: {
          section: 'overview',
          codeExamples: [],
          keyConcepts: this.extractAllConcepts(output),
          lastUpdated: output.metadata.extractedAt,
          provider: 'claude-extracted',
          extractionMethod: 'claude-driven'
        }
      });
    }

    // Process each section
    for (const section of output.sections) {
      // Main section document
      const sectionContent = this.formatSectionContent(section);
      if (sectionContent.length > 100) {
        // Only store meaningful chunks
        documents.push({
          id: uuidv4(),
          source: output.source,
          title: `${output.pageTitle} - ${section.title}`,
          content: sectionContent,
          metadata: {
            section: section.title,
            codeExamples: section.codeExamples?.map(ex => ex.code) || [],
            keyConcepts: section.keyConcepts || [],
            lastUpdated: output.metadata.extractedAt,
            provider: 'claude-extracted',
            extractionMethod: 'claude-driven'
          }
        });
      }

      // Create separate documents for significant code examples
      for (const example of section.codeExamples || []) {
        if (example.code.length > 50) {
          // Only store substantial code examples
          documents.push({
            id: uuidv4(),
            source: output.source,
            title: `Code: ${example.demonstrates?.join(', ') || section.title}`,
            content: this.formatCodeExample(example, section.title),
            metadata: {
              section: `${section.title} - Code Example`,
              codeExamples: [example.code],
              keyConcepts: example.demonstrates || [],
              lastUpdated: output.metadata.extractedAt,
              provider: 'claude-extracted',
              extractionMethod: 'claude-driven'
            }
          });
        }
      }
    }

    return documents;
  }

  /**
   * Format main content for embedding
   */
  private formatMainContent(output: ClaudeDocOutput): string {
    const parts = [`# ${output.pageTitle}`, '', output.summary, ''];

    if (output.prerequisites && output.prerequisites.length > 0) {
      parts.push('## Prerequisites');
      parts.push(output.prerequisites!.join('\n- '));
      parts.push('');
    }

    if (output.useCases && output.useCases.length > 0) {
      parts.push('## Common Use Cases');
      parts.push(output.useCases!.join('\n- '));
      parts.push('');
    }

    return parts.join('\n').trim();
  }

  /**
   * Format section content for embedding with enhanced metadata
   */
  private formatSectionContent(section: ClaudeDocSection): string {
    const parts = [`## ${section.title}`, ''];

    // Add search metadata at the top for better semantic matching
    if (section.searchKeywords && section.searchKeywords.length > 0) {
      parts.push(`SEARCH TERMS: ${section.searchKeywords.join(', ')}`);
      parts.push('');
    }

    if (section.aliases && section.aliases.length > 0) {
      parts.push(`ALSO KNOWN AS: ${section.aliases.join(', ')}`);
      parts.push('');
    }

    parts.push(section.content);
    parts.push('');

    if (section.keyConcepts && section.keyConcepts.length > 0) {
      parts.push(`Key concepts: ${section.keyConcepts.join(', ')}`);
      parts.push('');
    }

    if (section.warnings && section.warnings.length > 0) {
      parts.push('### Important Notes');
      section.warnings!.forEach(warning => parts.push(`⚠️ ${warning}`));
      parts.push('');
    }

    if (section.bestPractices && section.bestPractices.length > 0) {
      parts.push('### Best Practices');
      section.bestPractices!.forEach(practice => parts.push(`✓ ${practice}`));
      parts.push('');
    }

    if (section.relatedSections && section.relatedSections.length > 0) {
      parts.push(`See also: ${section.relatedSections!.join(', ')}`);
    }

    return parts.join('\n').trim();
  }

  /**
   * Format code example for embedding
   */
  private formatCodeExample(example: CodeExample, sectionTitle: string): string {
    const parts = [`Code example from ${sectionTitle}`];

    if (example.description) {
      parts.push('');
      parts.push(example.description);
    }

    if (example.demonstrates && example.demonstrates.length > 0) {
      parts.push('');
      parts.push(`This demonstrates: ${example.demonstrates.join(', ')}`);
    }

    parts.push('');
    parts.push(`\`\`\`${example.language}`);
    parts.push(example.code);
    parts.push('```');

    return parts.join('\n');
  }

  /**
   * Extract all concepts from the output
   */
  private extractAllConcepts(output: ClaudeDocOutput): string[] {
    const concepts = new Set<string>();

    for (const section of output.sections) {
      section.keyConcepts?.forEach(concept => concepts.add(concept));
    }

    return Array.from(concepts);
  }

  /**
   * Ensure collection exists with proper configuration
   */
  private async ensureCollection(
    collectionName: string,
    provider: EmbeddingProvider
  ): Promise<void> {
    try {
      await this.qdrantClient.getCollection(collectionName);
    } catch (error: any) {
      // Collection doesn't exist, create it
      const dimensions = EMBEDDING_CONFIGS[provider].dimensions;
      await this.qdrantClient.createCollection(collectionName, {
        vectors: {
          size: dimensions,
          distance: 'Cosine'
        }
      });
      logger.info(`Created collection: ${collectionName}`);
    }
  }

  /**
   * Process raw JSON string from Claude
   */
  async processRawClaudeResponse(jsonString: string, source: string): Promise<IngestionResult> {
    try {
      const output: ClaudeDocOutput = JSON.parse(jsonString);

      // Add source if not present
      if (!output.source) {
        output.source = source;
      }

      // Add extraction timestamp if not present
      if (!output.metadata?.extractedAt) {
        output.metadata = {
          ...output.metadata,
          extractedAt: new Date().toISOString(),
          modelUsed: output.metadata?.modelUsed || 'claude-unknown'
        };
      }

      return await this.processClaudeOutput(output);
    } catch (error: any) {
      logger.error('Error parsing Claude response:', error);
      return {
        success: false,
        documentsProcessed: 0,
        embeddingsGenerated: 0,
        errors: [`Failed to parse JSON: ${error.message}`],
        stats: {
          totalSections: 0,
          totalCodeExamples: 0,
          totalConcepts: 0,
          processingTimeMs: 0
        }
      };
    }
  }
}
