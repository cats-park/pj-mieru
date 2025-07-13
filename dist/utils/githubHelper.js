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
    // @付きURLの場合、@を除去
    const cleanUrl = url.startsWith('@') ? url.slice(1) : url;
    const patterns = [
        // https://github.com/owner/repo
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+)(?:\/(.+))?)?$/,
        // https://github.com/owner/repo.git
        /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\.git$/,
        // git@github.com:owner/repo.git
        /^git@github\.com:([^\/]+)\/([^\/]+)\.git$/,
    ];
    for (const pattern of patterns) {
        const match = cleanUrl.match(pattern);
        if (match) {
            return {
                owner: match[1],
                repo: match[2].replace(/\.git$/, ''),
                branch: match[3], // ブランチが指定されていない場合はundefinedにする
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
        console.log(`🔗 Cloning repository: ${githubInfo.owner}/${githubInfo.repo}...`);
        // 1. 指定されたブランチでクローンを試す
        if (githubInfo.branch) {
            try {
                const cloneCommand = `git clone --depth 1 --branch ${githubInfo.branch} ${cloneUrl} ${tempDir}`;
                await execAsync(cloneCommand);
            }
            catch (branchError) {
                console.log(`⚠️  指定されたブランチ '${githubInfo.branch}' が見つかりません。デフォルトブランチを試します...`);
                // 指定ブランチが失敗した場合は、デフォルトブランチでクローン
                await fs.promises.rm(tempDir, { recursive: true, force: true });
                await fs.promises.mkdir(tempDir, { recursive: true });
                const defaultCloneCommand = `git clone --depth 1 ${cloneUrl} ${tempDir}`;
                await execAsync(defaultCloneCommand);
            }
        }
        else {
            // 2. ブランチが指定されていない場合、main/masterブランチを順番に試す
            const branchesToTry = ['main', 'master', 'develop', 'dev'];
            let cloneSuccessful = false;
            for (const branch of branchesToTry) {
                try {
                    const cloneCommand = `git clone --depth 1 --branch ${branch} ${cloneUrl} ${tempDir}`;
                    await execAsync(cloneCommand);
                    cloneSuccessful = true;
                    break;
                }
                catch (branchError) {
                    // このブランチが存在しない場合は次を試す
                    try {
                        await fs.promises.rm(tempDir, { recursive: true, force: true });
                        await fs.promises.mkdir(tempDir, { recursive: true });
                    }
                    catch (cleanupError) {
                        // クリーンアップエラーは無視
                    }
                }
            }
            // 全てのブランチが失敗した場合は、デフォルトブランチでクローン
            if (!cloneSuccessful) {
                try {
                    const defaultCloneCommand = `git clone --depth 1 ${cloneUrl} ${tempDir}`;
                    await execAsync(defaultCloneCommand);
                }
                catch (defaultError) {
                    throw new Error(`Failed to clone with any branch: ${defaultError}`);
                }
            }
        }
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
    // @付きURLの場合、@を除去してから判定
    const cleanInput = input.startsWith('@') ? input.slice(1) : input;
    return /^(https:\/\/github\.com\/|git@github\.com:)/.test(cleanInput);
}
/**
 * GitHub URLまたはローカルパスを処理して、解析可能なディレクトリパスを返す
 */
export async function resolveProjectPath(input) {
    if (isGitHubUrl(input)) {
        const githubInfo = parseGitHubUrl(input);
        if (!githubInfo) {
            throw new Error(`無効なGitHub URL: ${input}`);
        }
        const tempDir = await cloneGitHubRepo(githubInfo);
        return {
            path: tempDir,
            isTemporary: true,
            cleanup: async () => {
                await cleanupTempDir(tempDir);
            }
        };
    }
    else {
        // ローカルパス
        const resolvedPath = path.resolve(input);
        try {
            await fs.promises.access(resolvedPath);
            return {
                path: resolvedPath,
                isTemporary: false
            };
        }
        catch (error) {
            throw new Error(`ディレクトリが存在しません: ${resolvedPath}`);
        }
    }
}
// オブジェクトエクスポート（CLI用）
export const githubHelper = {
    isGitHubUrl,
    parseGitHubUrl,
    cloneRepository: async (url) => {
        const githubInfo = parseGitHubUrl(url);
        if (!githubInfo) {
            throw new Error(`無効なGitHub URL: ${url}`);
        }
        const localPath = await cloneGitHubRepo(githubInfo);
        return {
            localPath,
            repoName: githubInfo.repo
        };
    },
    cleanup: cleanupTempDir
};
//# sourceMappingURL=githubHelper.js.map