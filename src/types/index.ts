// Re-export types from individual modules
export * from './ast.js';
export * from './scanner.js';
export * from './vue.js';
export * from './page.js';
export * from './mermaid.js';
export * from './dependency.js';

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
