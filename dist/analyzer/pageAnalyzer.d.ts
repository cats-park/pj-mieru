import { PageStructure } from '../types/page.js';
import { ScannedFile } from '../types/scanner.js';
import { AstAnalysisResult } from '../types/ast.js';
import { VueSfcAnalysisResult } from '../types/vue.js';
export declare class PageAnalyzer {
    private pagePatterns;
    private linkPatterns;
    analyzePages(files: ScannedFile[], astResults: AstAnalysisResult[], vueResults: VueSfcAnalysisResult[]): Promise<PageStructure>;
    private identifyPageFiles;
    private analyzePage;
    private extractPageComponents;
    private extractTemplateComponents;
    private isValidComponentName;
    private extractPageLinks;
    private analyzePageConnections;
    private isComponentImport;
    private getComponentType;
    private generateRoute;
    private generatePageName;
    private determinePageType;
    private determineLinkType;
    private mapLinkTypeToConnectionType;
    private deduplicateComponents;
    private findPageByRoute;
    private countIsolatedPages;
    private extractLinkText;
    private getLineNumber;
    /**
     * Recursively expand component dependencies
     */
    private expandComponentDependencies;
    /**
     * Recursively get all component dependencies
     */
    private getComponentDependenciesRecursively;
    /**
     * Find component file by name or import path
     */
    private findComponentFile;
}
//# sourceMappingURL=pageAnalyzer.d.ts.map