import { DependencyGraph, ComponentRelation, ComponentNode } from '../types/dependency.js';
/**
 * コンポーネント関係分析クラス
 */
export declare class RelationshipAnalyzer {
    /**
     * 依存関係グラフからコンポーネント関係を分析
     */
    analyzeRelationships(graph: DependencyGraph): ComponentRelation[];
    /**
     * 2つのコンポーネント間の関係を分析
     */
    private analyzeRelationship;
    /**
     * BFS で最短パスを見つける
     */
    private findPath;
    /**
     * 兄弟関係かどうかをチェック
     */
    private areSiblings;
    /**
     * ノードの直接的な親を取得
     */
    private getParents;
    /**
     * ノードの直接的な子を取得
     */
    private getChildren;
    /**
     * 依存関係の統計を計算
     */
    calculateRelationshipStats(relations: ComponentRelation[]): {
        parentChild: number;
        sibling: number;
        ancestor: number;
        descendant: number;
        independent: number;
        totalRelations: number;
        avgDepth: number;
        maxDepth: number;
    };
    /**
     * 最も依存されているコンポーネントを特定
     */
    findMostDependedComponents(graph: DependencyGraph, limit?: number): {
        node: ComponentNode;
        dependencyCount: number;
    }[];
    /**
     * 最も依存しているコンポーネントを特定
     */
    findMostDependingComponents(graph: DependencyGraph, limit?: number): {
        node: ComponentNode;
        dependencyCount: number;
    }[];
    /**
     * 依存関係のクラスターを検出
     */
    detectClusters(graph: DependencyGraph, minClusterSize?: number): string[][];
    /**
     * 連結成分を見つける（無向グラフとして扱う）
     */
    private findConnectedComponent;
}
//# sourceMappingURL=relationshipAnalyzer.d.ts.map