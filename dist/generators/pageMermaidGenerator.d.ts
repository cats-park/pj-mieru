import { PageStructure, PageDiagramConfig } from '../types/page.js';
export declare class PageMermaidGenerator {
    private config;
    constructor(config?: Partial<PageDiagramConfig>);
    generateDiagram(pageStructure: PageStructure): string;
    private groupPagesByFunction;
    private determinePageGroup;
    private generateSubgraphLabel;
    private generatePageNode;
    private getGroupIcon;
    private getPageIcon;
    private getDisplayName;
    private sanitizePageId;
    private sanitizeComponentId;
    private getComponentIcon;
    private sanitizeId;
    updateConfig(newConfig: Partial<PageDiagramConfig>): void;
    getConfig(): Required<PageDiagramConfig>;
    private groupComponentsByDepth;
    private addComponentsHierarchically;
    private generateBeautifulStyling;
}
//# sourceMappingURL=pageMermaidGenerator.d.ts.map