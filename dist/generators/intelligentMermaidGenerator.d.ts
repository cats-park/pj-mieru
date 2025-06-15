import { IntelligentAnalysisResult } from '../analyzer/intelligentAnalyzer.js';
export interface IntelligentMermaidConfig {
    title: string;
    showFrameworkInfo: boolean;
    showComponentTypes: boolean;
    showUsageContext: boolean;
    groupByDirectory: boolean;
}
export declare class IntelligentMermaidGenerator {
    private config;
    constructor(config?: Partial<IntelligentMermaidConfig>);
    generateDiagram(result: IntelligentAnalysisResult): string;
    generatePageComponentDiagram(result: IntelligentAnalysisResult): string;
    generateMarkdownReport(result: IntelligentAnalysisResult): string;
    private generateEnhancedPageComponentRelationships;
    private generatePageComponentRelationships;
    private groupPagesByDirectory;
    private extractDirectory;
    private getPageDisplayName;
    private getComponentTypeIcon;
    private sanitizeId;
    private generateEnhancedStyling;
    private generateStyling;
}
//# sourceMappingURL=intelligentMermaidGenerator.d.ts.map