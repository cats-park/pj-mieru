import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
const execAsync = promisify(exec);
/**
 * GitHub URLを解析してリポジトリ情報を取得
 */
export function parseGitHubUrl(url) {
    const patterns = [
        // https://github.com/owner/repo
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.+))?)?$/,
        // https://github.com/owner/repo.git
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\.git$/,
        // git@github.com:owner/repo.git
        /^git@github\.com:([^\/]+)\/([^\/]+)\.git$/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return {
                owner: match[1],
                repo: match[2].replace(/\.git$/, ''),
                branch: match[3] || 'main',
                path: match[4],
            };
        }
    }
    return null;
}
/**
 * GitHubリポジトリをクローンして一時ディレクトリに展開
 */
export async function cloneGitHubRepo(githubInfo) {
    const tempDir = path.join(os.tmpdir(), `mieru-${githubInfo.owner}-${githubInfo.repo}-${Date.now()}`);
    try {
        // 一時ディレクトリ作成
        await fs.promises.mkdir(tempDir, { recursive: true });
        // gitクローン実行
        const cloneUrl = `https://github.com/${githubInfo.owner}/${githubInfo.repo}.git`;
        const cloneCommand = `git clone --depth 1 --branch ${githubInfo.branch} ${cloneUrl} ${tempDir}`;
        console.log(`🔗 Cloning repository: ${githubInfo.owner}/${githubInfo.repo}...`);
        await execAsync(cloneCommand);
        // 指定されたパスがある場合は、そのサブディレクトリを返す
        if (githubInfo.path) {
            const targetPath = path.join(tempDir, githubInfo.path);
            if (await fs.promises.access(targetPath).then(() => true).catch(() => false)) {
                return targetPath;
            }
        }
        return tempDir;
    }
    catch (error) {
        // エラー時は一時ディレクトリをクリーンアップ
        try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
        }
        catch (cleanupError) {
            // クリーンアップエラーは無視
        }
        throw new Error(`Failed to clone GitHub repository: ${error}`);
    }
}
/**
 * 一時ディレクトリをクリーンアップ
 */
export async function cleanupTempDir(tempDir) {
    try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up temporary directory: ${tempDir}`);
    }
    catch (error) {
        console.warn(`Warning: Failed to cleanup temporary directory: ${error}`);
    }
}
/**
 * 入力がGitHub URLかローカルパスかを判定
 */
export function isGitHubUrl(input) {
    return /^(https:\/\/github\.com\/|git@github\.com:)/.test(input);
}
/**
 * GitHub URLまたはローカルパスを処理して、解析可能なディレクトリパスを返す
 */
export async function resolveProjectPath(input) {
    if (isGitHubUrl(input)) {
        const githubInfo = parseGitHubUrl(input);
        if (!githubInfo) {
            throw new Error(`Invalid GitHub URL format: ${input}`);
        }
        const tempPath = await cloneGitHubRepo(githubInfo);
        return {
            path: tempPath,
            isTemporary: true,
            cleanup: () => cleanupTempDir(tempPath),
        };
    }
    // ローカルパスの場合
    const absolutePath = path.resolve(input);
    try {
        await fs.promises.access(absolutePath);
        return {
            path: absolutePath,
            isTemporary: false,
        };
    }
    catch (error) {
        throw new Error(`Local path does not exist: ${absolutePath}`);
    }
}
//# sourceMappingURL=githubHelper.js.map