/**
 * Pipeline Logging Service Types
 * Type definitions for structured pipeline logging
 */

export type LogLevel = 'info' | 'error' | 'warning';
export type PipelineStage = 'fetch' | 'extract' | 'embed';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  stage: PipelineStage;
  url: string;
  message: string;
  duration_ms?: number;
  model?: string;
  provider?: string;
  error?: string;
  raw_response?: string;
  section_count?: number;
  code_example_count?: number;
  vector_count?: number;
  [key: string]: any;
}
