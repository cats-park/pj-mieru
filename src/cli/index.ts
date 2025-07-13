#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import { writeFile } from 'fs/promises';
import { resolveProjectPath, isGitHubUrl } from '../utils/githubHelper.js';
import { UnifiedAnalyzer } from '../analyzer/unifiedAnalyzer.js';
import { ErrorHandler } from '../core/errorHandler.js';

const program = new Command();

// プロジェクト名を抽出する関数
function extractProjectName(inputPath: string): string {
  // GitHub URLの場合
  if (isGitHubUrl(inputPath)) {
    const url = new URL(inputPath);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2) {
      return pathSegments[pathSegments.length - 1]; // リポジトリ名
    }
  }

  // ローカルパスの場合
  const normalizedPath = path.normalize(inputPath);
  const projectName = path.basename(normalizedPath);
  return projectName;
}

// Version and basic info
program
  .name('mieru')
  .description(
    'React、Vue、Next.js、Nuxt.js等のプロジェクト構造を可視化するツール'
  )
  .version('1.0.0');

// Analyze command - シンプルな1つのコマンド
program
  .command('analyze')
  .description('プロジェクトを解析してページとコンポーネントの構造を可視化する')
  .argument('<path>', 'プロジェクトのパス (ローカルパス または GitHub URL)')
  .option('--output <name>', '出力ファイル名のプレフィックス')
  .option('--verbose', '詳細なログを表示', false)
  .action(async (inputPath: string, options) => {
    const isGitHub = isGitHubUrl(inputPath);
    const projectName = extractProjectName(inputPath);
    const outputPrefix = options.output || `analysis-${projectName}`;

    console.log(`🔍 プロジェクトを解析中: ${inputPath}`);
    console.log(
      `🌐 ソース: ${isGitHub ? 'GitHub リポジトリ' : 'ローカルディレクトリ'}`
    );
    console.log(`📁 プロジェクト名: ${projectName}`);
    console.log('');

    let resolvedPath: {
      path: string;
      isTemporary: boolean;
      cleanup?: () => Promise<void>;
    } | null = null;

    try {
      // パスを解決（GitHub URLまたはローカルパス）
      resolvedPath = await resolveProjectPath(inputPath);
      const projectPath = resolvedPath.path;

      // 統合解析エンジンを使用
      const analyzer = new UnifiedAnalyzer(projectPath);
      const result = await analyzer.analyze();

      // 結果を表示
      console.log('');
      console.log('📊 解析結果:');
      console.log(
        `   フレームワーク: ${result.framework.name} (信頼度: ${result.framework.confidence}%)`
      );
      console.log(`   総ファイル数: ${result.totalFiles}`);
      console.log(`   検出ページ数: ${result.pages.length}`);
      console.log(`   解析時間: ${result.analysisTime}ms`);
      console.log(
        `   LLM使用量: ${result.tokenUsage.totalTokens} tokens (${result.tokenUsage.llmCalls} calls)`
      );
      console.log('');

      // ページ詳細を表示
      if (result.pages.length > 0) {
        console.log('📄 検出されたページ:');
        result.pages.forEach((page, index) => {
          console.log(`   ${index + 1}. ${page.name} (${page.route})`);
          console.log(`      ファイル: ${page.filePath}`);
          console.log(`      コンポーネント: ${page.components.length}個`);
          if (options.verbose) {
            console.log(`      理由: ${page.reason}`);
          }
        });
        console.log('');
      } else {
        console.log('⚠️  ページが検出されませんでした。');
        console.log('');
      }

      // Markdownレポートを生成
      const markdownContent = generateMarkdownReport(
        result,
        projectName,
        inputPath
      );
      const outputFileName = `${outputPrefix}-pages.md`;
      const outputPath = path.join('output', outputFileName);

      // outputディレクトリが存在しない場合は作成
      try {
        await import('fs').then((fs) =>
          fs.promises.mkdir('output', { recursive: true })
        );
      } catch (error) {
        // ディレクトリが既に存在する場合は無視
      }

      await writeFile(outputPath, markdownContent);

      console.log(`📝 レポートを生成しました: ${outputPath}`);

      // 詳細ログを表示（オプション）
      if (options.verbose) {
        console.log('');
        console.log('📋 詳細ログ:');
        result.analysisLog.forEach((log) => console.log(`   ${log}`));
      }
    } catch (error) {
      ErrorHandler.handleError(error);
    } finally {
      // 一時ディレクトリのクリーンアップ
      if (resolvedPath?.cleanup) {
        try {
          await resolvedPath.cleanup();
        } catch (cleanupError) {
          console.warn(
            `Warning: クリーンアップに失敗しました: ${cleanupError}`
          );
        }
      }
    }
  });

// Init command for creating config file
program
  .command('init')
  .description('Initialize mieru configuration file')
  .option('-f, --force', 'Overwrite existing config file')
  .action(async (options: { force?: boolean }) => {
    try {
      await initConfig(options.force);
    } catch (error) {
      ErrorHandler.handleError(error);
    }
  });

// Markdownレポート生成関数
function generateMarkdownReport(
  result: any,
  projectName: string,
  inputPath: string
): string {
  const { framework, pages, totalFiles, analysisTime } = result;

  let markdown = `# ${projectName} - ページ構造解析レポート

## 📊 プロジェクト概要

- **プロジェクト名**: ${projectName}
- **ソース**: ${inputPath}
- **フレームワーク**: ${framework.name} ${framework.version ? `(${framework.version})` : ''}
- **信頼度**: ${framework.confidence}%
- **総ファイル数**: ${totalFiles}
- **解析時間**: ${analysisTime}ms
- **LLM使用量**: ${result.tokenUsage.totalTokens} tokens (${result.tokenUsage.llmCalls} calls)
- **生成日時**: ${new Date().toLocaleString('ja-JP')}

## 📄 検出されたページ (${pages.length}個)

`;

  if (pages.length === 0) {
    markdown += `⚠️ ページが検出されませんでした。

### 考えられる原因:
1. プロジェクトが対応フレームワーク（React、Vue、Next.js、Nuxt.js）でない
2. ページファイルが標準的な場所にない
3. ファイル名が一般的でない

`;
    // 空のMermaid図を追加
    markdown += `
## 🗺️ プロジェクト構造図

\`\`\`mermaid
flowchart LR
  empty["ページが検出されませんでした"]
  style empty fill:#FFF3CD,stroke:#856404,color:#856404
\`\`\`

`;
  } else {
    // Mermaid図を追加
    markdown += generateMermaidDiagram(pages);

    // 各ページの詳細を追加
    pages.forEach((page: any, index: number) => {
      markdown += `### ${index + 1}. 📄 ${page.name}

- **ファイル**: \`${page.filePath}\`
- **ルート**: \`${page.route}\`
- **コンポーネント数**: ${page.components.length}個
- **判定理由**: ${page.reason}

`;

      if (page.components.length > 0) {
        markdown += `#### 🧩 使用コンポーネント

`;
        page.components.forEach((comp: any) => {
          markdown += renderComponentHierarchy(comp, 0);
        });
        markdown += '\n';
      }
    });
  }

  markdown += `## 🔧 技術詳細

### フレームワーク情報
- **検出パターン**: ${framework.pagePatterns?.join(', ') || 'なし'}
- **コンポーネントパターン**: ${framework.componentPatterns?.join(', ') || 'なし'}

### 解析統計
- **総ファイル数**: ${totalFiles}
- **ページ数**: ${pages.length}
- **総コンポーネント数**: ${pages.reduce((sum: number, page: any) => sum + page.components.length, 0)}

### LLM使用量詳細
- **総トークン数**: ${result.tokenUsage.totalTokens}
- **プロンプトトークン数**: ${result.tokenUsage.promptTokens}
- **レスポンストークン数**: ${result.tokenUsage.completionTokens}
- **API呼び出し回数**: ${result.tokenUsage.llmCalls}

---
*このレポートは [mieru](https://github.com/your-repo/mieru) によって生成されました。*
`;

  return markdown;
}

// Mermaid図生成関数
function generateMermaidDiagram(pages: any[]): string {
  if (pages.length === 0) {
    return '';
  }

  let mermaid = `
## 🗺️ プロジェクト構造図

\`\`\`mermaid
flowchart TB

%% ページ構造図
%% 階層構造をsubgraphで表現

`;

  pages.forEach((page: any, index: number) => {
    const pageId = `page${index + 1}`;

    // ページのsubgraphを作成
    mermaid += `  subgraph ${pageId} ["📄 ${page.name}"]\n`;
    mermaid += `    direction TB\n`;

    if (page.components.length === 0) {
      mermaid += `    ${pageId}_placeholder[" "]\n`;
      mermaid += `    style ${pageId}_placeholder fill:transparent,stroke:transparent\n`;
    } else {
      let compCounter = 0;

      const addComponentHierarchy = (
        comp: any,
        depth: number = 0,
        indentLevel: number = 1
      ) => {
        const compId = `${pageId}_comp${compCounter++}`;
        const icon = getComponentIcon(comp.type);
        const blueIntensity = getBlueColorByDepth(depth);
        const indent = '  '.repeat(indentLevel);

        // コンポーネントに子がある場合はsubgraphとして描画
        if (comp.children && comp.children.length > 0) {
          mermaid += `${indent}  subgraph ${compId} ["🧩 ${comp.name}"]\n`;
          mermaid += `${indent}    direction TB\n`;

          // 子コンポーネントを再帰的に追加（正しいインデントで配置）
          comp.children.forEach((child: any) => {
            const childId = `${pageId}_comp${compCounter++}`;
            const childIcon = getComponentIcon(child.type);
            const childBlueIntensity = getBlueColorByDepth(depth + 1);

            if (child.children && child.children.length > 0) {
              // 子コンポーネントにも子がある場合
              mermaid += `${indent}    subgraph ${childId} ["🧩 ${child.name}"]\n`;
              mermaid += `${indent}      direction TB\n`;

              // 孫コンポーネントを追加
              child.children.forEach((grandChild: any) => {
                const grandChildId = `${pageId}_comp${compCounter++}`;
                const grandChildIcon = getComponentIcon(grandChild.type);
                const grandChildBlueIntensity = getBlueColorByDepth(depth + 2);

                mermaid += `${indent}      ${grandChildId}["${grandChildIcon} ${grandChild.name}"]\n`;
                mermaid += `${indent}      style ${grandChildId} fill:${grandChildBlueIntensity.fill},stroke:${grandChildBlueIntensity.stroke},color:#FFFFFF\n`;
              });

              mermaid += `${indent}    end\n`;
              mermaid += `${indent}    style ${childId} fill:${childBlueIntensity.fill},stroke:${childBlueIntensity.stroke},color:#FFFFFF\n`;
            } else {
              // 子コンポーネントに子がない場合
              mermaid += `${indent}    ${childId}["${childIcon} ${child.name}"]\n`;
              mermaid += `${indent}    style ${childId} fill:${childBlueIntensity.fill},stroke:${childBlueIntensity.stroke},color:#FFFFFF\n`;
            }
          });

          mermaid += `${indent}  end\n`;
          mermaid += `${indent}  style ${compId} fill:${blueIntensity.fill},stroke:${blueIntensity.stroke},color:#FFFFFF\n`;
        } else {
          // 子がない場合は通常のノードとして描画
          mermaid += `${indent}  ${compId}["${icon} ${comp.name}"]\n`;
          mermaid += `${indent}  style ${compId} fill:${blueIntensity.fill},stroke:${blueIntensity.stroke},color:#FFFFFF\n`;
        }
      };

      page.components.forEach((comp: any) => {
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

  mermaid += `\`\`\`

`;

  return mermaid;
}

// 深度に応じた青色の取得関数
function getBlueColorByDepth(depth: number): { fill: string; stroke: string } {
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
function getComponentIcon(type: string): string {
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

// コンポーネント階層を再帰的に表示する関数
function renderComponentHierarchy(component: any, depth: number): string {
  const indent = '  '.repeat(depth);
  const icon = getComponentIcon(component.type);

  let markdown = `${indent}- ${icon} **${component.name}** (${component.type})`;
  if (component.filePath) {
    markdown += ` - \`${component.filePath}\``;
  }
  markdown += '\n';

  // 子コンポーネントがある場合は再帰的に表示
  if (component.children && component.children.length > 0) {
    for (const child of component.children) {
      markdown += renderComponentHierarchy(child, depth + 1);
    }
  }

  return markdown;
}

// 設定ファイル初期化関数
async function initConfig(force?: boolean): Promise<void> {
  const configPath = path.join(process.cwd(), 'mieru.config.json');

  // 既存のファイルがある場合の処理
  try {
    const { stat } = await import('fs/promises');
    await stat(configPath);
    if (!force) {
      console.log(`⚠️  設定ファイルが既に存在します: ${configPath}`);
      console.log('上書きする場合は --force オプションを使用してください。');
      return;
    }
  } catch {
    // ファイルが存在しない場合は続行
  }

  const config = {
    framework: 'auto',
    pagePatterns: [
      'pages/**/*.{vue,js,jsx,ts,tsx}',
      'src/pages/**/*.{vue,js,jsx,ts,tsx}',
      'src/views/**/*.{vue,js,jsx,ts,tsx}',
      'app/**/*.{vue,js,jsx,ts,tsx}',
    ],
    componentPatterns: [
      'components/**/*.{vue,js,jsx,ts,tsx}',
      'src/components/**/*.{vue,js,jsx,ts,tsx}',
    ],
    excludePatterns: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/*.stories.{js,jsx,ts,tsx}',
      '**/node_modules/**',
    ],
    maxDepth: 10,
    verbose: false,
  };

  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ 設定ファイルを作成しました: ${configPath}`);
}

export function runCLI(args?: string[]): void {
  if (args) {
    program.parse(args);
  } else {
    program.parse();
  }
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI();
}
