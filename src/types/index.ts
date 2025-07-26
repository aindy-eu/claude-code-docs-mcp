export interface SearchResult {
  content: string;
  title: string;
  section: string;
  url: string;
  score: number;
  codeExamples: string[];
  provider: string;
  // Enhanced metadata from Claude-driven ingestion
  keyConcepts?: string[];
  extractionMethod?: string;
  pageTitle?: string;
  summary?: string;
  lastUpdated?: string;
}

export interface SearchParams {
  query: string;
  provider?: 'ollama' | 'openai' | 'both';
  limit?: number;
}