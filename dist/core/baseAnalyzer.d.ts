import { ScannedFile } from '../types/scanner.js';
import { AstAnalysisResult } from '../types/ast.js';
import { VueSfcAnalysisResult } from '../types/vue.js';
export interface BaseAnalysisOptions {
    maxDepth?: number;
    includeHidden?: boolean;
    verbose?: boolean;
}
export interface BaseAnalysisResult {
    scanResult: {
        files: ScannedFile[];
        totalFiles: number;
        scanDuration: number;
        errors: string[];
    };
    astResults: AstAnalysisResult[];
    vueResults: VueSfcAnalysisResult[];
}
export declare class BaseAnalyzer {
    analyzeProject(projectPath: string, options?: BaseAnalysisOptions): Promise<BaseAnalysisResult>;
}
//# sourceMappingURL=baseAnalyzer.d.ts.map