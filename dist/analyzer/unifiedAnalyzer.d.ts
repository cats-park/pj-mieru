export interface FrameworkInfo {
    name: string;
    version?: string;
    confidence: number;
    pagePatterns: string[];
    componentPatterns: string[];
}
export interface PageInfo {
    name: string;
    filePath: string;
    route: string;
    components: ComponentInfo[];
    reason: string;
}
export interface ComponentInfo {
    name: string;
    type: 'component' | 'layout' | 'utility' | 'hook';
    filePath?: string;
    children: ComponentInfo[];
}
export interface UnifiedAnalysisResult {
    framework: FrameworkInfo;
    pages: PageInfo[];
    totalFiles: number;
    analysisTime: number;
    analysisLog: string[];
}
export declare class UnifiedAnalyzer {
    private projectPath;
    private llmClient;
    private analysisLog;
    private startTime;
    constructor(projectPath: string);
    analyze(): Promise<UnifiedAnalysisResult>;
    private scanFiles;
    private detectFramework;
    private detectFrameworkFallback;
    private getStructureHints;
    private identifyPages;
    private analyzePageComponents;
    private extractComponentsFromPage;
    private log;
}
//# sourceMappingURL=unifiedAnalyzer.d.ts.map