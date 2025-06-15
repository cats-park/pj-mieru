import { AstAnalysisResult, AstParseOptions, BatchAnalysisResult } from '../types/ast.js';
/**
 * JavaScript/TypeScript AST解析クラス
 */
export declare class AstParser {
    /**
     * ファイルの内容を解析してAST情報を抽出
     */
    analyzeFile(filePath: string, options?: AstParseOptions): Promise<AstAnalysisResult>;
    /**
     * 複数ファイルの一括解析
     */
    analyzeFiles(filePaths: string[], options?: AstParseOptions): Promise<BatchAnalysisResult>;
    /**
     * 文字列コンテンツを解析（Vue SFC用）
     */
    analyzeContent(content: string, virtualPath: string, options?: AstParseOptions): Promise<AstAnalysisResult>;
    /**
     * ファイル拡張子から言語を検出
     */
    private detectLanguage;
    /**
     * ファイル拡張子からScriptKindを決定
     */
    private getScriptKind;
    /**
     * ASTノードを再帰的に訪問
     */
    private visitNode;
    /**
     * インポート文を抽出
     */
    private extractImport;
    /**
     * エクスポート文を抽出
     */
    private extractExport;
    /**
     * 関数定義を抽出
     */
    private extractFunctionDefinition;
    /**
     * 変数定義を抽出
     */
    private extractVariableDefinitions;
    /**
     * クラス定義を抽出
     */
    private extractClassDefinition;
    /**
     * JSX要素を抽出
     */
    private extractJsxUsage;
    /**
     * ノードの行番号を取得
     */
    private getLineNumber;
    /**
     * exportモディファイアが付いているかチェック
     */
    private hasExportModifier;
    /**
     * export defaultモディファイアが付いているかチェック
     */
    private hasDefaultExportModifier;
}
export declare const astParser: AstParser;
//# sourceMappingURL=astParser.d.ts.map