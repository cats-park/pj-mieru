#!/usr/bin/env node
import { Command } from 'commander';
import { UnifiedAnalyzer } from '../analyzer/unifiedAnalyzer.js';
import { githubHelper } from '../utils/githubHelper.js';
import { ConfigManager } from '../utils/config.js';
import path from 'path';
import fs from 'fs/promises';
// Mermaid diagram generation function
function createMermaidDiagram(pages) {
    if (pages.length === 0) {
        return `flowchart LR
  empty["ページが検出されませんでした"]
  style empty fill:#FFF3CD,stroke:#856404,color:#856404`;
    }
    let mermaid = `flowchart TB

%% ページ構造図
%% 階層構造をsubgraphで表現

`;
    pages.forEach((page, index) => {
        const pageId = `page${index + 1}`;
        // ページのsubgraphを作成
        mermaid += `  subgraph ${pageId} ["📄 ${page.name}"]\n`;
        mermaid += `    direction TB\n`;
        if (page.components.length === 0) {
            mermaid += `    ${pageId}_placeholder[" "]\n`;
            mermaid += `    style ${pageId}_placeholder fill:transparent,stroke:transparent\n`;
        }
        else {
            let compCounter = 0;
            const addComponentHierarchy = (comp, depth = 0, indentLevel = 1) => {
                const compId = `${pageId}_comp${compCounter++}`;
                const icon = getComponentIcon(comp.type);
                const blueIntensity = getBlueColorByDepth(depth);
                const indent = '  '.repeat(indentLevel);
                // コンポーネントに子がある場合はsubgraphとして描画
                if (comp.children && comp.children.length > 0) {
                    mermaid += `${indent}  subgraph ${compId} ["🧩 ${comp.name}"]\n`;
                    mermaid += `${indent}    direction TB\n`;
                    // 子コンポーネントを再帰的に追加
                    comp.children.forEach((child) => {
                        const childId = `${pageId}_comp${compCounter++}`;
                        const childIcon = getComponentIcon(child.type);
                        const childBlueIntensity = getBlueColorByDepth(depth + 1);
                        if (child.children && child.children.length > 0) {
                            // 子コンポーネントにも子がある場合
                            mermaid += `${indent}    subgraph ${childId} ["🧩 ${child.name}"]\n`;
                            mermaid += `${indent}      direction TB\n`;
                            // 孫コンポーネントを追加
                            child.children.forEach((grandChild) => {
                                const grandChildId = `${pageId}_comp${compCounter++}`;
                                const grandChildIcon = getComponentIcon(grandChild.type);
                                const grandChildBlueIntensity = getBlueColorByDepth(depth + 2);
                                mermaid += `${indent}      ${grandChildId}["${grandChildIcon} ${grandChild.name}"]\n`;
                                mermaid += `${indent}      style ${grandChildId} fill:${grandChildBlueIntensity.fill},stroke:${grandChildBlueIntensity.stroke},color:#FFFFFF\n`;
                            });
                            mermaid += `${indent}    end\n`;
                            mermaid += `${indent}    style ${childId} fill:${childBlueIntensity.fill},stroke:${childBlueIntensity.stroke},color:#FFFFFF\n`;
                        }
                        else {
                            // 子コンポーネントに子がない場合
                            mermaid += `${indent}    ${childId}["${childIcon} ${child.name}"]\n`;
                            mermaid += `${indent}    style ${childId} fill:${childBlueIntensity.fill},stroke:${childBlueIntensity.stroke},color:#FFFFFF\n`;
                        }
                    });
                    mermaid += `${indent}  end\n`;
                    mermaid += `${indent}  style ${compId} fill:${blueIntensity.fill},stroke:${blueIntensity.stroke},color:#FFFFFF\n`;
                }
                else {
                    // 子がない場合は通常のノードとして描画
                    mermaid += `${indent}  ${compId}["${icon} ${comp.name}"]\n`;
                    mermaid += `${indent}  style ${compId} fill:${blueIntensity.fill},stroke:${blueIntensity.stroke},color:#FFFFFF\n`;
                }
            };
            page.components.forEach((comp) => {
                addComponentHierarchy(comp, 0, 1);
            });
        }
        mermaid += `  end\n`;
        mermaid += `  style ${pageId} fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32\n\n`;
    });
    // ページ間に見えない接続線を追加して縦並びを強制
    for (let i = 0; i < pages.length - 1; i++) {
        const currentPageId = `page${i + 1}`;
        const nextPageId = `page${i + 2}`;
        mermaid += `  ${currentPageId} -.-> ${nextPageId}\n`;
    }
    // 見えない接続線のスタイル
    for (let i = 0; i < pages.length - 1; i++) {
        mermaid += `  linkStyle ${i} stroke:transparent\n`;
    }
    return mermaid;
}
// 深度に応じた青色の取得関数
function getBlueColorByDepth(depth) {
    const colors = [
        { fill: '#7BB3F0', stroke: '#4A90E2' }, // 深度0: 明るい青
        { fill: '#5A9FDD', stroke: '#3A7BD5' }, // 深度1: 中間の青
        { fill: '#4A8CCA', stroke: '#2A6BC8' }, // 深度2: 濃い青
        { fill: '#3A79B7', stroke: '#1A5BB5' }, // 深度3: より濃い青
        { fill: '#2A66A4', stroke: '#0A4BA2' }, // 深度4: 最も濃い青
    ];
    // 深度が配列の範囲を超えた場合は最後の色を使用
    const colorIndex = Math.min(depth, colors.length - 1);
    return colors[colorIndex];
}
// コンポーネントアイコン取得関数
function getComponentIcon(type) {
    switch (type) {
        case 'component':
            return '🧩';
        case 'layout':
            return '📐';
        case 'utility':
            return '🔧';
        case 'hook':
            return '🎣';
        default:
            return '📦';
    }
}
const program = new Command();
program
    .name('mieru')
    .description('プロジェクトのページ構造を可視化するCLIツール')
    .version('1.0.0');
// setup コマンド
program
    .command('setup')
    .description('初回セットアップ（APIキー設定等）')
    .action(async () => {
    try {
        await ConfigManager.setupInteractive();
    }
    catch (error) {
        console.error('❌ セットアップに失敗しました:', error);
        process.exit(1);
    }
});
// analyze コマンド
program
    .command('analyze')
    .description('プロジェクト構造を解析してレポートを生成')
    .argument('<source>', 'プロジェクトのパス（ローカルパスまたはGitHub URL）')
    .option('--api-key <key>', 'OpenAI APIキー')
    .option('--max-depth <number>', '最大解析深度', '5')
    .option('--output <path>', '出力ディレクトリ', './output')
    .option('--include-external', '外部ライブラリを含める', false)
    .action(async (source, options) => {
    try {
        // APIキーを取得
        const apiKey = await ConfigManager.getApiKey(options.apiKey);
        let projectPath;
        let projectName;
        let isGitHub = false;
        if (githubHelper.isGitHubUrl(source)) {
            console.log(`🔍 プロジェクトを解析中: ${source}`);
            console.log('🌐 ソース: GitHub リポジトリ');
            const cloneResult = await githubHelper.cloneRepository(source);
            projectPath = cloneResult.localPath;
            projectName = cloneResult.repoName;
            isGitHub = true;
            console.log(`📁 プロジェクト名: ${projectName}`);
            console.log();
        }
        else {
            const resolvedPath = path.resolve(source);
            try {
                await fs.access(resolvedPath);
                projectPath = resolvedPath;
                projectName = path.basename(resolvedPath);
                console.log(`🔍 プロジェクトを解析中: ${projectPath}`);
                console.log('📁 ソース: ローカルディレクトリ');
                console.log(`📁 プロジェクト名: ${projectName}`);
                console.log();
            }
            catch {
                console.error(`❌ エラー: ディレクトリが存在しません: ${resolvedPath}`);
                process.exit(1);
            }
        }
        // 解析実行
        const analyzer = new UnifiedAnalyzer(projectPath, { apiKey });
        const result = await analyzer.analyze();
        // 結果表示
        console.log('\n📊 解析結果:');
        console.log(`   フレームワーク: ${result.framework.name} (信頼度: ${result.framework.confidence}%)`);
        console.log(`   総ファイル数: ${result.totalFiles}`);
        console.log(`   検出ページ数: ${result.pages.length}`);
        console.log(`   解析時間: ${result.analysisTime}ms`);
        console.log(`   LLM使用量: ${result.tokenUsage.totalTokens} tokens (${result.tokenUsage.llmCalls} calls)`);
        // ページ一覧表示
        if (result.pages.length > 0) {
            console.log('\n📄 検出されたページ:');
            result.pages.forEach((page, index) => {
                const componentCount = countTotalComponents(page.components);
                console.log(`   ${index + 1}. ${page.name} (${page.route})`);
                console.log(`      ファイル: ${page.filePath}`);
                console.log(`      コンポーネント: ${componentCount}個`);
            });
        }
        else {
            console.log('\n⚠️  ページが検出されませんでした。');
        }
        // Mermaidダイアグラム生成
        const mermaidDiagram = createMermaidDiagram(result.pages);
        // 出力ディレクトリの作成
        const outputDir = path.resolve(options.output);
        await fs.mkdir(outputDir, { recursive: true });
        // レポート生成
        const reportContent = generateMarkdownReport(result, source, mermaidDiagram);
        const reportPath = path.join(outputDir, `analysis-${projectName}-pages.md`);
        await fs.writeFile(reportPath, reportContent, 'utf-8');
        console.log(`\n📝 レポートを生成しました: ${reportPath}`);
        // GitHub リポジトリの場合はクリーンアップ
        if (isGitHub) {
            await githubHelper.cleanup(projectPath);
            console.log(`🧹 Cleaned up temporary directory: ${projectPath}`);
        }
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('OpenAI APIキーが見つかりません')) {
            console.error(error.message);
            process.exit(1);
        }
        else {
            console.error('❌ 解析中にエラーが発生しました:', error);
            process.exit(1);
        }
    }
});
// config コマンド
program
    .command('config')
    .description('設定の表示・変更')
    .option('--show', '現在の設定を表示')
    .option('--reset', '設定をリセット')
    .action(async (options) => {
    try {
        if (options.show) {
            const config = await ConfigManager.loadConfig();
            console.log('📋 現在の設定:');
            console.log(JSON.stringify({ ...config, openaiApiKey: config.openaiApiKey ? '****' : 'not set' }, null, 2));
        }
        else if (options.reset) {
            await ConfigManager.saveConfig({});
            console.log('✅ 設定をリセットしました');
        }
        else {
            console.log('使用方法: mieru config --show または mieru config --reset');
        }
    }
    catch (error) {
        console.error('❌ 設定の操作に失敗しました:', error);
        process.exit(1);
    }
});
// ヘルプを表示
if (process.argv.length === 2) {
    program.outputHelp();
}
program.parse();
function countTotalComponents(components) {
    let count = components.length;
    for (const component of components) {
        if (component.children && Array.isArray(component.children)) {
            count += countTotalComponents(component.children);
        }
    }
    return count;
}
function generateMarkdownReport(result, source, mermaidDiagram) {
    const now = new Date();
    const timestamp = now.toLocaleString('ja-JP');
    return `# ${result.projectName || 'Project'} - ページ構造解析レポート

## 📊 プロジェクト概要

- **プロジェクト名**: ${result.projectName || 'Unknown'}
- **ソース**: ${source}
- **フレームワーク**: ${result.framework.name} (${result.framework.version || 'Unknown'})
- **信頼度**: ${result.framework.confidence}%
- **総ファイル数**: ${result.totalFiles}
- **解析時間**: ${result.analysisTime}ms
- **LLM使用量**: ${result.tokenUsage.totalTokens} tokens (${result.tokenUsage.llmCalls} calls)
- **生成日時**: ${timestamp}

## 📄 検出されたページ (${result.pages.length}個)

${result.pages.length === 0 ? '\n⚠️ ページが検出されませんでした。\n\n### 考えられる原因:\n1. プロジェクトが対応フレームワーク（React、Vue、Next.js、Nuxt.js）でない\n2. ページファイルが標準的な場所にない\n3. ファイル名が一般的でない\n' : ''}

## 🗺️ プロジェクト構造図

\`\`\`mermaid
${mermaidDiagram}
\`\`\`

${result.pages.map((page, index) => {
        const componentCount = countTotalComponents(page.components);
        return `### ${index + 1}. 📄 ${page.name}

- **ファイル**: \`${page.filePath}\`
- **ルート**: \`${page.route}\`
- **コンポーネント数**: ${componentCount}個
- **判定理由**: ${page.reason}

#### 🧩 使用コンポーネント

${generateComponentList(page.components)}`;
    }).join('\n\n')}

## 🔧 技術詳細

### フレームワーク情報
- **検出パターン**: ${result.framework.pagePatterns?.join(', ') || 'なし'}
- **コンポーネントパターン**: ${result.framework.componentPatterns?.join(', ') || 'なし'}

### 解析統計
- **総ファイル数**: ${result.totalFiles}
- **ページ数**: ${result.pages.length}
- **総コンポーネント数**: ${result.pages.reduce((total, page) => total + countTotalComponents(page.components), 0)}

### LLM使用量詳細
- **総トークン数**: ${result.tokenUsage.totalTokens}
- **プロンプトトークン数**: ${result.tokenUsage.promptTokens}
- **レスポンストークン数**: ${result.tokenUsage.completionTokens}
- **API呼び出し回数**: ${result.tokenUsage.llmCalls}

---
*このレポートは [mieru](https://github.com/your-repo/mieru) によって生成されました。*
`;
}
function generateComponentList(components, depth = 0) {
    if (!components || components.length === 0) {
        return '';
    }
    return components.map(component => {
        const indent = '  '.repeat(depth);
        const hasChildren = component.children && component.children.length > 0;
        const childrenText = hasChildren ? generateComponentList(component.children, depth + 1) : '';
        return `${indent}- 🧩 **${component.name}** (${component.type}) - \`${component.filePath || 'unknown'}\`${childrenText ? '\n' + childrenText : ''}`;
    }).join('\n');
}
// CLI実行関数
export function runCLI(args) {
    if (args) {
        program.parse(args);
    }
    else {
        program.parse();
    }
}
// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
    runCLI();
}
//# sourceMappingURL=index.js.map