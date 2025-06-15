/**
 * コンポーネントノード情報
 */
export interface ComponentNode {
    /** ファイルパス */
    filePath: string;
    /** 相対パス */
    relativePath: string;
    /** コンポーネント名 */
    name: string;
    /** ファイルタイプ */
    type: 'vue' | 'react' | 'angular' | 'svelte' | 'js' | 'ts';
    /** ファイルサイズ（バイト） */
    size: number;
    /** 最終更新日時 */
    lastModified: Date;
    /** エクスポートタイプ */
    exportType: 'default' | 'named' | 'both' | 'none';
    /** 定義された関数・変数の数 */
    definitionCount: number;
    /** 行数 */
    lineCount: number;
}
/**
 * 依存関係エッジ情報
 */
export interface DependencyEdge {
    /** ソースコンポーネント */
    from: string;
    /** ターゲットコンポーネント */
    to: string;
    /** 依存関係の種類 */
    type: 'import' | 'component-usage' | 'dynamic-import' | 'require';
    /** インポート名 */
    importName?: string;
    /** インポートが使用された行番号 */
    line: number;
    /** 強度（使用回数） */
    weight: number;
    /** プロパティとして渡される値 */
    props?: string[];
}
/**
 * 循環依存情報
 */
export interface CircularDependency {
    /** 循環しているコンポーネント群 */
    cycle: string[];
    /** 循環の深度 */
    depth: number;
    /** 循環を構成するエッジ */
    edges: DependencyEdge[];
}
/**
 * 依存関係解析結果
 */
export interface DependencyGraph {
    /** すべてのコンポーネントノード */
    nodes: Map<string, ComponentNode>;
    /** すべての依存関係エッジ */
    edges: DependencyEdge[];
    /** 循環依存 */
    circularDependencies: CircularDependency[];
    /** 解析統計 */
    stats: {
        /** 総ノード数 */
        totalNodes: number;
        /** 総エッジ数 */
        totalEdges: number;
        /** 循環依存数 */
        circularCount: number;
        /** 孤立したノード数 */
        isolatedNodes: number;
        /** 最大依存深度 */
        maxDepth: number;
        /** 解析時間（ミリ秒） */
        analysisTime: number;
    };
}
/**
 * コンポーネント関係タイプ
 */
export type ComponentRelationType = 'parent-child' | 'sibling' | 'ancestor' | 'descendant' | 'independent';
/**
 * コンポーネント関係情報
 */
export interface ComponentRelation {
    /** 関係元コンポーネント */
    from: string;
    /** 関係先コンポーネント */
    to: string;
    /** 関係タイプ */
    relation: ComponentRelationType;
    /** 関係の深度（0=直接、1以上=間接） */
    depth: number;
    /** 経路（間接的な場合） */
    path?: string[];
}
/**
 * 依存関係解析オプション
 */
export interface DependencyAnalysisOptions {
    /** 最大解析深度 */
    maxDepth?: number;
    /** 循環依存の検出を行うか */
    detectCircular?: boolean;
    /** 動的インポートを含めるか */
    includeDynamicImports?: boolean;
    /** node_modulesを除外するか */
    excludeNodeModules?: boolean;
    /** 除外するパターン */
    excludePatterns?: string[];
    /** 最小ファイルサイズ（バイト） */
    minFileSize?: number;
    /** 最大ファイルサイズ（バイト） */
    maxFileSize?: number;
}
//# sourceMappingURL=dependency.d.ts.map