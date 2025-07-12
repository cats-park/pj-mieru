import { PageStructure } from '../types/page.js';
import { ScannedFile } from '../types/scanner.js';
import { AstAnalysisResult } from '../types/ast.js';
import { VueSfcAnalysisResult } from '../types/vue.js';
export declare class PageAnalyzer {
    private projectPath;
    constructor(projectPath?: string);
    private pagePatterns;
    private linkPatterns;
    analyzePages(files: ScannedFile[], astResults: AstAnalysisResult[], vueResults: VueSfcAnalysisResult[]): Promise<PageStructure>;
    /**
     * プロジェクトタイプを検出
     */
    private detectProjectType;
    /**
     * React系プロジェクトの解析
     */
    private analyzeReactPages;
    /**
     * ルーティング解析結果からPageStructureを構築
     */
    private buildPageStructureFromRouting;
    /**
     * 依存関係リストからPageComponentを構築
     */
    private buildComponentsFromDependencies;
    /**
     * Vue系プロジェクトの解析（従来の方法）
     */
    private analyzeVuePages;
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