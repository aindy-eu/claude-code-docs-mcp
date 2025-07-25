export interface SearchResult {
  content: string;
  title: string;
  section: string;
  url: string;
  score: number;
  codeExamples: string[];
  provider: string;
}

export interface SearchParams {
  query: string;
  provider?: 'ollama' | 'openai' | 'both';
  limit?: number;
}