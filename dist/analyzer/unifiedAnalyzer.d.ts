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
    tokenUsage: {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
        llmCalls: number;
    };
}
export declare class UnifiedAnalyzer {
    private projectPath;
    private llmClient;
    private analysisLog;
    private startTime;
    private tokenUsage;
    constructor(projectPath: string, options?: {
        apiKey?: string;
    });
    analyze(): Promise<UnifiedAnalysisResult>;
    private scanFiles;
    private detectFramework;
    private detectFrameworkFallback;
    private getStructureHints;
    private identifyPages;
    private isPageFile;
    private generatePageName;
    private generateRoute;
    private analyzePageComponents;
    private extractComponentsRecursively;
    private findComponentFile;
    private countTotalComponents;
    private isComposableFunction;
    private isExternalLibraryComponent;
    private trackTokenUsage;
    private log;
    private repairIncompleteJson;
    private extractComponentsWithRegex;
}
//# sourceMappingURL=unifiedAnalyzer.d.ts.map