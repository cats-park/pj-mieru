/**
 * インポート情報の型定義
 */
export interface ImportInfo {
    type: 'default' | 'named' | 'namespace' | 'side-effect';
    name: string;
    source: string;
    line: number;
    original?: string;
}
/**
 * コンポーネント使用情報
 */
export interface ComponentUsage {
    name: string;
    props: string[];
    line: number;
}
/**
 * 定義情報（関数、変数、クラスなど）
 */
export interface DefinitionInfo {
    type: 'function' | 'variable' | 'class' | 'component';
    name: string;
    line: number;
    exported: boolean;
    exportType?: 'default' | 'named';
}
/**
 * エクスポート情報
 */
export interface ExportInfo {
    type: 'default' | 'named';
    name: string;
    line: number;
}
/**
 * 単一ファイルのAST解析結果
 */
export interface AstAnalysisResult {
    filePath: string;
    relativePath: string;
    language: string;
    imports: ImportInfo[];
    componentUsages: ComponentUsage[];
    definitions: DefinitionInfo[];
    exports: ExportInfo[];
    errors: string[];
    parseTime: number;
}
/**
 * AST解析オプション
 */
export interface AstParseOptions {
    typescript?: boolean;
    jsx?: boolean;
    decorators?: boolean;
    privateProperties?: boolean;
}
/**
 * 複数ファイルの一括解析結果
 */
export interface BatchAnalysisResult {
    results: AstAnalysisResult[];
    totalFiles: number;
    successCount: number;
    errorCount: number;
    totalTime: number;
}
//# sourceMappingURL=ast.d.ts.map