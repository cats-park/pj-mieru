export * from './scanner.js';
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
//# sourceMappingURL=index.d.ts.map