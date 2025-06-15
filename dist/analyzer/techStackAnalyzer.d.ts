import { ScannedFile } from '../types/scanner.js';
export interface TechStackInfo {
    languages: LanguageInfo[];
    frameworks: FrameworkInfo[];
    buildTools: BuildToolInfo[];
    packageManager: string;
    primaryFramework: string;
    primaryLanguage: string;
}
export interface LanguageInfo {
    name: string;
    percentage: number;
    fileCount: number;
    extensions: string[];
}
export interface FrameworkInfo {
    name: string;
    version?: string;
    confidence: 'high' | 'medium' | 'low';
    indicators: string[];
}
export interface BuildToolInfo {
    name: string;
    version?: string;
    configFiles: string[];
}
export declare class TechStackAnalyzer {
    analyzeTechStack(projectPath: string, files: ScannedFile[]): Promise<TechStackInfo>;
    private readPackageJson;
    private analyzeLanguages;
    private analyzeFrameworksWithLLM;
    private gatherProjectContext;
    private buildFrameworkAnalysisPrompt;
    private parseLLMFrameworkResponse;
    private readConfigFiles;
    private analyzeFileStructure;
    private extractCodeSnippets;
    private getDirectoryStructure;
    private analyzeFrameworksTraditional;
    private analyzeBuildTools;
    private detectPackageManager;
    private determinePrimaryFramework;
    private determinePrimaryLanguage;
}
//# sourceMappingURL=techStackAnalyzer.d.ts.map