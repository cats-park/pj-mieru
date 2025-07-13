export * from './scanner.js';

// CLI-specific types
export interface CliOptions {
  input: string;
  output?: string;
  format?: 'html' | 'json' | 'mermaid' | 'page-structure';
  config?: string;
  verbose?: boolean;
  pages?: boolean;
  components?: boolean;
  maxDepth?: string;
  pageStructure?: boolean;
  groupByDirectory?: boolean;
}
