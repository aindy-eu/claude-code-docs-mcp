/**
 * Type definitions for Claude-driven documentation ingestion
 * These interfaces define the expected structure of Claude's output
 * when reading and processing documentation
 */

export interface ClaudeDocSection {
  /** Title of the documentation section */
  title: string;

  /** Main content of the section */
  content: string;

  /** Search keywords for better discoverability (includes abbreviations, alternate spellings, related terms) */
  searchKeywords?: string[];

  /** Alternative names or ways to refer to this feature */
  aliases?: string[];

  /** Code examples found in this section */
  codeExamples?: CodeExample[];

  /** Key concepts or terms introduced */
  keyConcepts?: string[];

  /** Related sections or cross-references */
  relatedSections?: string[];

  /** Important warnings or notes */
  warnings?: string[];

  /** Best practices mentioned */
  bestPractices?: string[];
}

export interface CodeExample {
  /** Language of the code block */
  language: string;

  /** The actual code */
  code: string;

  /** Description or context for the code */
  description?: string;

  /** What this example demonstrates */
  demonstrates?: string[];
}

export interface ClaudeDocOutput {
  /** Source URL or identifier */
  source: string;

  /** Overall title of the documentation page */
  pageTitle: string;

  /** Brief summary of what this documentation covers */
  summary: string;

  /** All sections extracted from the documentation */
  sections: ClaudeDocSection[];

  /** Metadata about the extraction */
  metadata: {
    /** When this was extracted */
    extractedAt: string;

    /** Which model/version was used */
    modelUsed: string;

    /** Any issues encountered during extraction */
    extractionNotes?: string[];
  };

  /** Prerequisites or dependencies mentioned */
  prerequisites?: string[];

  /** Common use cases or scenarios */
  useCases?: string[];
}

export interface IngestionPromptTemplate {
  /** Type of documentation being ingested */
  docType: 'overview' | 'tutorial' | 'reference' | 'guide' | 'troubleshooting';

  /** The prompt template */
  template: string;

  /** Expected output format instructions */
  outputInstructions: string;

  /** Specific aspects to focus on */
  focusAreas?: string[];
}

export interface ProcessedDocument {
  /** Unique identifier for this document */
  id: string;

  /** Original source */
  source: string;

  /** Title of the document */
  title: string;

  /** Processed content ready for embedding */
  content: string;

  /** Extracted metadata */
  metadata: {
    section: string;
    codeExamples: string[];
    keyConcepts: string[];
    lastUpdated: string;
    provider: 'claude-extracted';
    extractionMethod: 'claude-driven';
    qualityScore?: number;
  };
}

export interface IngestionResult {
  /** Whether the ingestion was successful */
  success: boolean;

  /** Number of documents processed */
  documentsProcessed: number;

  /** Number of embeddings generated */
  embeddingsGenerated: number;

  /** Any errors encountered */
  errors?: string[];

  /** Processing statistics */
  stats: {
    totalSections: number;
    totalCodeExamples: number;
    totalConcepts: number;
    processingTimeMs: number;
  };
}

export interface IngestionTracker {
  /** Set of processed document URLs/IDs */
  processed: Set<string>;

  /** Documents pending processing */
  pending: string[];

  /** Last update timestamp */
  lastUpdated: Date;

  /** Processing history */
  history: Array<{
    documentId: string;
    processedAt: Date;
    success: boolean;
    notes?: string;
  }>;
}
