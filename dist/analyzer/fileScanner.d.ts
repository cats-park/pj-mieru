import { ScanOptions, ScanResult } from '../types/scanner.js';
/**
 * ファイルシステムスキャナー
 * プロジェクトディレクトリから関連ファイルを再帰的にスキャンする
 */
export declare class FileScanner {
    private readonly supportedExtensions;
    private readonly defaultIgnorePatterns;
    /**
     * ディレクトリをスキャンして関連ファイルを取得
     * @param projectPath スキャンするプロジェクトディレクトリのパス
     * @param options スキャンオプション
     * @returns スキャン結果
     */
    scanProject(projectPath: string, options?: ScanOptions): Promise<ScanResult>;
    /**
     * ディレクトリを再帰的にスキャン
     * @param currentPath 現在のディレクトリパス
     * @param rootPath ルートディレクトリパス
     * @param files ファイル配列（参照渡し）
     * @param errors エラー配列（参照渡し）
     * @param options スキャンオプション
     */
    private scanDirectory;
    /**
     * プロジェクトパスの妥当性を検証
     * @param projectPath プロジェクトパス
     */
    private validateProjectPath;
    /**
     * ファイル・ディレクトリを無視するかチェック
     * @param name ファイル・ディレクトリ名
     * @param relativePath 相対パス
     * @param options スキャンオプション
     * @returns 無視する場合はtrue
     */
    private shouldIgnore;
    /**
     * サポート対象ファイルかチェック
     * @param fileName ファイル名
     * @param options スキャンオプション
     * @returns サポート対象の場合はtrue
     */
    private isSupportedFile;
    /**
     * サポートされている拡張子一覧を取得
     * @returns 拡張子配列
     */
    getSupportedExtensions(): string[];
}
/**
 * デフォルトのファイルスキャナーインスタンス
 */
export declare const fileScanner: FileScanner;
//# sourceMappingURL=fileScanner.d.ts.map