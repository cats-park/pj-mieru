import { VueSfcAnalysisResult, VueSfcAnalysisOptions } from '../types/vue.js';
/**
 * Vue単一ファイルコンポーネント（SFC）解析クラス
 */
export declare class VueSfcParser {
    private astParser;
    constructor();
    /**
     * Vueファイルを解析
     */
    analyzeFile(filePath: string, options?: VueSfcAnalysisOptions): Promise<VueSfcAnalysisResult>;
    /**
     * 複数のVueファイルを一括解析
     */
    analyzeFiles(filePaths: string[], options?: VueSfcAnalysisOptions): Promise<VueSfcAnalysisResult[]>;
    /**
     * スクリプトブロックを解析
     */
    private parseScriptBlock;
    /**
     * テンプレートブロックを解析
     */
    private parseTemplateBlock;
    /**
     * スタイルブロックを解析
     */
    private parseStyleBlock;
    /**
     * スクリプト内容をAST解析
     */
    private analyzeScriptContent;
    /**
     * テンプレート内のコンポーネント使用を解析
     */
    private analyzeTemplateComponents;
    /**
     * ファイル内のオフセットから行番号を取得
     */
    private getLineNumber;
    /**
     * エラー結果を作成
     */
    private createErrorResult;
}
//# sourceMappingURL=vueSfcParser.d.ts.map