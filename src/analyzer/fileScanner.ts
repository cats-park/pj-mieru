import fs from 'fs';
import path from 'path';
import { ScannedFile, ScanOptions, ScanResult } from '../types/scanner.js';

/**
 * ファイルシステムスキャナー
 * プロジェクトディレクトリから関連ファイルを再帰的にスキャンする
 */
export class FileScanner {
  private readonly supportedExtensions = ['.vue', '.jsx', '.tsx', '.js', '.ts'];
  private readonly defaultIgnorePatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.nuxt',
    '.next',
    'coverage',
    '.nyc_output',
    '.cache',
  ];

  /**
   * ディレクトリをスキャンして関連ファイルを取得
   * @param projectPath スキャンするプロジェクトディレクトリのパス
   * @param options スキャンオプション
   * @returns スキャン結果
   */
  async scanProject(
    projectPath: string,
    options: ScanOptions = {}
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const files: ScannedFile[] = [];
    const errors: string[] = [];

    try {
      // プロジェクトパスの存在確認
      await this.validateProjectPath(projectPath);

      // ファイルスキャンを実行
      await this.scanDirectory(
        projectPath,
        projectPath,
        files,
        errors,
        options
      );

      const endTime = Date.now();

      return {
        files,
        errors,
        totalFiles: files.length,
        scanDuration: endTime - startTime,
        projectPath: path.resolve(projectPath),
        scannedAt: new Date().toISOString(),
      };
    } catch (error) {
      errors.push(
        `スキャンエラー: ${error instanceof Error ? error.message : String(error)}`
      );

      return {
        files,
        errors,
        totalFiles: 0,
        scanDuration: Date.now() - startTime,
        projectPath: path.resolve(projectPath),
        scannedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * ディレクトリを再帰的にスキャン
   * @param currentPath 現在のディレクトリパス
   * @param rootPath ルートディレクトリパス
   * @param files ファイル配列（参照渡し）
   * @param errors エラー配列（参照渡し）
   * @param options スキャンオプション
   */
  private async scanDirectory(
    currentPath: string,
    rootPath: string,
    files: ScannedFile[],
    errors: string[],
    options: ScanOptions
  ): Promise<void> {
    try {
      const entries = await fs.promises.readdir(currentPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        // 無視パターンのチェック
        if (this.shouldIgnore(entry.name, relativePath, options)) {
          continue;
        }

        // 最大深度のチェック
        if (options.maxDepth !== undefined) {
          const depth = relativePath.split(path.sep).length - 1;
          if (depth >= options.maxDepth) {
            continue;
          }
        }

        if (entry.isDirectory()) {
          // ディレクトリの場合は再帰的にスキャン
          await this.scanDirectory(fullPath, rootPath, files, errors, options);
        } else if (entry.isFile()) {
          // ファイルの場合は対象ファイルかチェック
          if (this.isSupportedFile(entry.name, options)) {
            try {
              const stat = await fs.promises.stat(fullPath);

              files.push({
                name: entry.name,
                path: fullPath,
                relativePath,
                extension: path.extname(entry.name),
                size: stat.size,
                lastModified: stat.mtime.toISOString(),
              });
            } catch (error) {
              errors.push(
                `ファイル情報取得エラー (${relativePath}): ${error instanceof Error ? error.message : String(error)}`
              );
            }
          }
        }
      }
    } catch (error) {
      errors.push(
        `ディレクトリ読み取りエラー (${path.relative(rootPath, currentPath)}): ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * プロジェクトパスの妥当性を検証
   * @param projectPath プロジェクトパス
   */
  private async validateProjectPath(projectPath: string): Promise<void> {
    try {
      const stat = await fs.promises.stat(projectPath);
      if (!stat.isDirectory()) {
        throw new Error('指定されたパスはディレクトリではありません');
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('指定されたディレクトリが存在しません');
      }
      throw error;
    }
  }

  /**
   * ファイル・ディレクトリを無視するかチェック
   * @param name ファイル・ディレクトリ名
   * @param relativePath 相対パス
   * @param options スキャンオプション
   * @returns 無視する場合はtrue
   */
  private shouldIgnore(
    name: string,
    relativePath: string,
    options: ScanOptions
  ): boolean {
    const ignorePatterns = [
      ...this.defaultIgnorePatterns,
      ...(options.ignorePatterns || []),
    ];

    // 隠しファイル・ディレクトリの除外（オプション）
    if (!options.includeHidden && name.startsWith('.')) {
      return true;
    }

    // 無視パターンのチェック
    return ignorePatterns.some((pattern) => {
      if (pattern.includes('*') || pattern.includes('?')) {
        // glob パターンのサポート（簡易版）
        const regex = new RegExp(
          pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
        );
        return regex.test(name) || regex.test(relativePath);
      } else {
        // 完全一致または部分一致
        return name === pattern || relativePath.includes(pattern);
      }
    });
  }

  /**
   * サポート対象ファイルかチェック
   * @param fileName ファイル名
   * @param options スキャンオプション
   * @returns サポート対象の場合はtrue
   */
  private isSupportedFile(fileName: string, options: ScanOptions): boolean {
    const extensions = options.includeExtensions || this.supportedExtensions;
    const extension = path.extname(fileName).toLowerCase();

    return extensions.includes(extension);
  }

  /**
   * サポートされている拡張子一覧を取得
   * @returns 拡張子配列
   */
  getSupportedExtensions(): string[] {
    return [...this.supportedExtensions];
  }
}

/**
 * デフォルトのファイルスキャナーインスタンス
 */
export const fileScanner = new FileScanner();
