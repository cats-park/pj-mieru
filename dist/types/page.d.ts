export interface PageInfo {
    /** ページファイルパス */
    filePath: string;
    /** ページ名 */
    name: string;
    /** ルートパス */
    route: string;
    /** ページタイプ */
    type: 'page' | 'layout' | 'component';
    /** ページで使用されているコンポーネント */
    components: PageComponent[];
    /** ページ間リンク */
    links: PageLink[];
    /** ファイルサイズ */
    size: number;
    /** 最終更新日時 */
    lastModified: Date;
}
export interface PageComponent {
    /** コンポーネント名 */
    name: string;
    /** インポート元パス */
    importPath: string;
    /** 使用箇所（行番号） */
    usageLines: number[];
    /** プロパティ */
    props?: string[];
    /** コンポーネントタイプ */
    type: 'vue' | 'react' | 'component' | 'layout';
    /** コンポーネントのネスト深度（再帰解析用） */
    depth?: number;
    /** 親コンポーネント名（再帰解析用） */
    parent?: string;
}
export interface PageLink {
    /** リンク先ページ */
    target: string;
    /** リンクタイプ */
    type: 'router-link' | 'href' | 'navigation' | 'dynamic';
    /** リンクテキスト */
    text?: string;
    /** 発見行番号 */
    line: number;
}
export interface PageStructure {
    /** すべてのページ */
    pages: Map<string, PageInfo>;
    /** ページ間の関係 */
    pageLinks: PageConnection[];
    /** サイト統計 */
    stats: {
        /** 総ページ数 */
        totalPages: number;
        /** 総コンポーネント数 */
        totalComponents: number;
        /** 総リンク数 */
        totalLinks: number;
        /** 孤立ページ数 */
        isolatedPages: number;
        /** 解析時間 */
        analysisTime: number;
    };
}
export interface PageConnection {
    /** ソースページ */
    from: string;
    /** ターゲットページ */
    to: string;
    /** 接続タイプ */
    type: 'navigation' | 'route' | 'link';
    /** 接続の強度（リンク数） */
    weight: number;
}
export interface PageDiagramConfig {
    /** 図の方向 */
    direction: 'TD' | 'LR' | 'BT' | 'RL';
    /** ページをグループ化するか */
    groupPages: boolean;
    /** コンポーネントを表示するか */
    showComponents: boolean;
    /** リンクラベルを表示するか */
    showLinkLabels: boolean;
    /** 最大ネスト深度 */
    maxNestDepth: number;
}
//# sourceMappingURL=page.d.ts.map