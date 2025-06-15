export interface FrameworkDetectionResult {
    framework: string;
    version?: string;
    confidence: number;
    pagePatterns: string[];
    componentPatterns: string[];
    configFiles: string[];
}
export interface PageComponentUsage {
    page: string;
    components: {
        name: string;
        type: 'component' | 'layout' | 'directive' | 'utility';
        usageContext: string;
    }[];
}
export interface IntelligentAnalysisResult {
    framework: FrameworkDetectionResult;
    projectStructure: string;
    relevantFiles: string[];
    pageComponentUsages: PageComponentUsage[];
    analysisLog: string[];
}
export declare class IntelligentAnalyzer {
    private projectPath;
    private analysisLog;
    private llmClient;
    constructor(projectPath: string);
    analyze(): Promise<IntelligentAnalysisResult>;
    private detectFramework;
    private getStructureHints;
    private directoryExists;
    private getProjectStructure;
    private getSimpleDirectoryListing;
    private identifyRelevantFiles;
    private validateFileExistence;
    private analyzePageComponentUsages;
    private isPageFile;
    private isComponentFile;
    private analyzeIndividualPage;
    private analyzeBatchFiles;
    private callLLM;
    private log;
}
//# sourceMappingURL=intelligentAnalyzer.d.ts.map