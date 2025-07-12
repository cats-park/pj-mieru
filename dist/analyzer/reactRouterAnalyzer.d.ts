import { ScannedFile } from '../types/scanner.js';
export interface RouteInfo {
    path: string;
    component: string;
    componentFile?: string;
    exact?: boolean;
    children?: RouteInfo[];
}
export interface ReactRouterAnalysisResult {
    appComponent: string;
    routes: RouteInfo[];
    pageComponents: string[];
    componentDependencies: Map<string, string[]>;
    analysisLog: string[];
}
/**
 * React系プロジェクトのルーティング情報を解析するクラス
 */
export declare class ReactRouterAnalyzer {
    private projectPath;
    private analysisLog;
    private scannedFiles;
    constructor(projectPath: string, scannedFiles?: ScannedFile[]);
    /**
     * React Router解析のメイン実行メソッド
     */
    analyzeRouting(): Promise<ReactRouterAnalysisResult>;
    /**
     * App.js/App.tsx を特定
     */
    private findAppComponent;
    /**
     * ファイルにルーティング情報が含まれているかチェック
     */
    private containsRouting;
    /**
     * ルーティング情報を抽出
     */
    private extractRoutes;
    /**
     * ファイル拡張子からScriptKindを決定
     */
    private getScriptKind;
    /**
     * ASTノードを訪問してRoute要素を検索
     */
    private visitNodeForRoutes;
    /**
     * Next.js のファイルベースルーティングを検出
     */
    private extractNextJSRoutes;
    /**
     * ファイルパスをNext.jsルートに変換
     */
    private convertFilePathToRoute;
    /**
     * JSX要素名を取得
     */
    private getJSXElementName;
    /**
     * Route要素からルート情報を抽出
     */
    private extractRouteInfo;
    /**
     * element prop からコンポーネント名を抽出
     */
    private extractComponentFromElement;
    /**
     * ルートコンポーネントのファイルパスを解決
     */
    private resolveRouteComponents;
    /**
     * コンポーネント名からファイルを検索
     */
    private findComponentFile;
    /**
     * コンポーネントの依存関係を再帰的に解析
     */
    private analyzeComponentDependencies;
    /**
     * コンポーネントの依存関係を再帰的に解析（内部メソッド）
     */
    private analyzeComponentDependenciesRecursive;
    /**
     * ファイルからコンポーネントの依存関係を抽出
     */
    private extractComponentDependencies;
    /**
     * ASTノードを訪問して依存関係を抽出
     */
    private visitNodeForDependencies;
    /**
     * インポートパスがコンポーネントかどうか判定
     */
    private isComponentImport;
    /**
     * インポートパスを実際のファイルパスに解決
     */
    private resolveImportPath;
    /**
     * カスタムコンポーネントかどうか判定
     */
    private isCustomComponent;
    /**
     * ログ出力
     */
    private log;
    /**
     * 解析ログを取得
     */
    getAnalysisLog(): string[];
}
//# sourceMappingURL=reactRouterAnalyzer.d.ts.map