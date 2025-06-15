export * from './ast.js';
export * from './scanner.js';
export * from './vue.js';
export * from './page.js';
export * from './mermaid.js';
export * from './dependency.js';
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