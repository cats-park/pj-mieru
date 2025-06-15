/**
 * スキャンされたファイルの情報
 */
export interface ScannedFile {
    /** ファイル名 */
    name: string;
    /** 絶対パス */
    path: string;
    /** プロジェクトルートからの相対パス */
    relativePath: string;
    /** ファイル拡張子 */
    extension: string;
    /** ファイルサイズ（バイト） */
    size: number;
    /** 最終更新日時（ISO文字列） */
    lastModified: string;
}
/**
 * スキャンオプション
 */
export interface ScanOptions {
    /** 含める拡張子（デフォルト: ['.vue', '.jsx', '.tsx', '.js', '.ts']） */
    includeExtensions?: string[];
    /** 無視するパターン（追加分） */
    ignorePatterns?: string[];
    /** 最大スキャン深度 */
    maxDepth?: number;
    /** 隠しファイル・ディレクトリを含めるか */
    includeHidden?: boolean;
}
/**
 * スキャン結果
 */
export interface ScanResult {
    /** スキャンされたファイル一覧 */
    files: ScannedFile[];
    /** エラー一覧 */
    errors: string[];
    /** 総ファイル数 */
    totalFiles: number;
    /** スキャン時間（ミリ秒） */
    scanDuration: number;
    /** スキャンしたプロジェクトパス */
    projectPath: string;
    /** スキャン実行日時（ISO文字列） */
    scannedAt: string;
}
//# sourceMappingURL=scanner.d.ts.map