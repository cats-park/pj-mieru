export interface GitHubInfo {
    owner: string;
    repo: string;
    branch?: string;
    path?: string;
}
/**
 * GitHub URLを解析してリポジトリ情報を取得
 */
export declare function parseGitHubUrl(url: string): GitHubInfo | null;
/**
 * GitHubリポジトリをクローンして一時ディレクトリに展開
 */
export declare function cloneGitHubRepo(githubInfo: GitHubInfo): Promise<string>;
/**
 * 一時ディレクトリをクリーンアップ
 */
export declare function cleanupTempDir(tempDir: string): Promise<void>;
/**
 * 入力がGitHub URLかローカルパスかを判定
 */
export declare function isGitHubUrl(input: string): boolean;
/**
 * GitHub URLまたはローカルパスを処理して、解析可能なディレクトリパスを返す
 */
export declare function resolveProjectPath(input: string): Promise<{
    path: string;
    isTemporary: boolean;
    cleanup?: () => Promise<void>;
}>;
export declare const githubHelper: {
    isGitHubUrl: typeof isGitHubUrl;
    parseGitHubUrl: typeof parseGitHubUrl;
    cloneRepository: (url: string) => Promise<{
        localPath: string;
        repoName: string;
    }>;
    cleanup: typeof cleanupTempDir;
};
//# sourceMappingURL=githubHelper.d.ts.map