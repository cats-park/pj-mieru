import { FrameworkDetectionResult } from './intelligentAnalyzer.js';
export interface SmartFileSelectorOptions {
    maxFiles?: number;
    prioritizeRecentFiles?: boolean;
    includeConfigFiles?: boolean;
    customPatterns?: string[];
}
export interface FileSelectionResult {
    selectedFiles: string[];
    categorizedFiles: {
        pages: string[];
        components: string[];
        layouts: string[];
        utilities: string[];
        config: string[];
    };
    selectionReasons: Record<string, string>;
    confidence: number;
}
/**
 * フレームワーク特定情報に基づいてLLMを活用した高精度ファイル選択を行うクラス
 */
export declare class SmartFileSelector {
    private projectPath;
    private llmClient;
    private analysisLog;
    constructor(projectPath: string);
    /**
     * フレームワーク情報を基にスマートなファイル選択を実行
     */
    selectRelevantFiles(framework: FrameworkDetectionResult, projectStructure: string, options?: SmartFileSelectorOptions): Promise<FileSelectionResult>;
    /**
     * フレームワーク固有のファイルパターンを生成
     */
    private generateFrameworkSpecificPatterns;
    /**
     * プロジェクト構造から候補ファイルを抽出
     */
    private extractCandidateFiles;
    /**
     * 追加の関連ファイルを検索
     */
    private findAdditionalRelevantFiles;
    /**
     * tree表示の深度を計算
     */
    private calculateTreeDepth;
    /**
     * ファイルが関連性があるかチェック
     */
    private isRelevantFile;
    /**
     * LLMを使用してファイルの重要度を評価
     */
    private evaluateFileImportance;
    /**
     * 評価されたファイルから最終選択と分類を実行
     */
    private selectAndCategorizeFiles;
    /**
     * フォールバック機能: 従来の方法でファイルを検索
     */
    private fallbackFileSelection;
    /**
     * プロジェクト構造を分析してメタデータを取得
     */
    private analyzeProjectStructure;
    /**
     * 基本的なファイル検索
     */
    private findBasicFiles;
    /**
     * 基本的なファイル分類
     */
    private categorizeBasicFiles;
    /**
     * ファイル存在確認
     */
    private validateFileExistence;
    /**
     * 存在しないファイルの代替案を提案
     */
    private suggestFileAlternatives;
    /**
     * プロジェクト全体から実際に存在するファイルを検索
     */
    private findExistingFiles;
    /**
     * 基本的な重要度計算（フォールバック用）
     */
    private calculateBasicImportance;
    /**
     * ファイルカテゴリーの推測（フォールバック用）
     */
    private guessFileCategory;
    /**
     * LLM API呼び出し
     */
    private callLLM;
    /**
     * ログ出力
     */
    private log;
    /**
     * 解析ログを取得
     */
    getAnalysisLog(): string[];
}
//# sourceMappingURL=smartFileSelector.d.ts.map