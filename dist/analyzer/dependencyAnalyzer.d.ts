import { DependencyGraph, DependencyAnalysisOptions } from '../types/dependency.js';
import { AstAnalysisResult } from '../types/ast.js';
import { VueSfcAnalysisResult } from '../types/vue.js';
import { ScanResult } from '../types/scanner.js';
/**
 * コンポーネント依存関係解析クラス
 */
export declare class DependencyAnalyzer {
    private options;
    constructor(options?: DependencyAnalysisOptions);
    /**
     * スキャン結果とAST解析結果から依存関係グラフを構築
     */
    analyze(scanResult: ScanResult, astResults: AstAnalysisResult[], vueResults?: VueSfcAnalysisResult[]): Promise<DependencyGraph>;
    /**
     * ノードマップを構築
     */
    private buildNodes;
    /**
     * AST解析結果からコンポーネントノードを作成
     */
    private createComponentNodeFromAst;
    /**
     * Vue SFC解析結果からコンポーネントノードを作成
     */
    private createComponentNodeFromVue;
    /**
     * エッジを構築
     */
    private buildEdges;
    /**
     * AST解析結果からエッジを作成
     */
    private createEdgesFromAst;
    /**
     * Vue SFC解析結果からエッジを作成
     */
    private createEdgesFromVue;
    /**
     * 循環依存を検出
     */
    private detectCircularDependencies;
    /**
     * ファイルタイプを取得
     */
    private getFileType;
    /**
     * コンポーネント名を抽出
     */
    private extractComponentName;
    /**
     * Vueコンポーネント名を抽出
     */
    private extractVueComponentName;
    /**
     * パスからコンポーネント名を取得
     */
    private getComponentNameFromPath;
    /**
     * インポートパスを解決
     */
    private resolveImportPath;
    /**
     * 循環のエッジを取得
     */
    private getCycleEdges;
    /**
     * 循環依存の重複を除去
     */
    private deduplicateCircularDependencies;
    /**
     * 統計を計算
     */
    private calculateStats;
    /**
     * 最大依存深度を計算
     */
    private calculateMaxDepth;
}
//# sourceMappingURL=dependencyAnalyzer.d.ts.map