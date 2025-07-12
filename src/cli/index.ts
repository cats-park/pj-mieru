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
  .description('React、Vue、Next.js、Nuxt.js等のプロジェクト構造を可視化するツール')
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
    console.log(`🌐 ソース: ${isGitHub ? 'GitHub リポジトリ' : 'ローカルディレクトリ'}`);
    console.log(`📁 プロジェクト名: ${projectName}`);
    console.log('');

    let resolvedPath: { path: string; isTemporary: boolean; cleanup?: () => Promise<void> } | null = null;

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
      console.log(`   フレームワーク: ${result.framework.name} (信頼度: ${result.framework.confidence}%)`);
      console.log(`   総ファイル数: ${result.totalFiles}`);
      console.log(`   検出ページ数: ${result.pages.length}`);
      console.log(`   解析時間: ${result.analysisTime}ms`);
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
      const markdownContent = generateMarkdownReport(result, projectName, inputPath);
      const outputFileName = `${outputPrefix}-pages.md`;
      await writeFile(outputFileName, markdownContent);

      console.log(`📝 レポートを生成しました: ${outputFileName}`);
      
      // 詳細ログを表示（オプション）
      if (options.verbose) {
        console.log('');
        console.log('📋 詳細ログ:');
        result.analysisLog.forEach(log => console.log(`   ${log}`));
      }

    } catch (error) {
      ErrorHandler.handleError(error);
    } finally {
      // 一時ディレクトリのクリーンアップ
      if (resolvedPath?.cleanup) {
        try {
          await resolvedPath.cleanup();
        } catch (cleanupError) {
          console.warn(`Warning: クリーンアップに失敗しました: ${cleanupError}`);
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
function generateMarkdownReport(result: any, projectName: string, inputPath: string): string {
  const { framework, pages, totalFiles, analysisTime } = result;
  
  let markdown = `# ${projectName} - ページ構造解析レポート

## 📊 プロジェクト概要

- **プロジェクト名**: ${projectName}
- **ソース**: ${inputPath}
- **フレームワーク**: ${framework.name} ${framework.version ? `(${framework.version})` : ''}
- **信頼度**: ${framework.confidence}%
- **総ファイル数**: ${totalFiles}
- **解析時間**: ${analysisTime}ms
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
          const icon = getComponentIcon(comp.type);
          markdown += `- ${icon} **${comp.name}** (${comp.type})`;
          if (comp.filePath) {
            markdown += ` - \`${comp.filePath}\``;
          }
          markdown += '\n';
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
flowchart LR

%% ページ構造図

`;

  pages.forEach((page: any, index: number) => {
    const pageId = `page${index + 1}`;
    const pageName = page.name.replace(/[^a-zA-Z0-9]/g, '');
    
    mermaid += `  subgraph ${pageId} ["📄 ${page.name}"]\n`;
    
    if (page.components.length === 0) {
      mermaid += `    ${pageId}_placeholder[" "]\n`;
      mermaid += `    style ${pageId}_placeholder fill:transparent,stroke:transparent\n`;
    } else {
      page.components.forEach((comp: any, compIndex: number) => {
        const compId = `${pageId}_c${compIndex}`;
        const icon = getComponentIcon(comp.type);
        mermaid += `    ${compId}["${icon} ${comp.name}"]\n`;
        mermaid += `    style ${compId} fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF\n`;
      });
    }
    
    mermaid += `  end\n`;
    mermaid += `  style ${pageId} fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32\n\n`;
  });

  mermaid += `\`\`\`

`;
  
  return mermaid;
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
      'app/**/*.{vue,js,jsx,ts,tsx}'
    ],
    componentPatterns: [
      'components/**/*.{vue,js,jsx,ts,tsx}',
      'src/components/**/*.{vue,js,jsx,ts,tsx}'
    ],
    excludePatterns: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/*.stories.{js,jsx,ts,tsx}',
      '**/node_modules/**'
    ],
    maxDepth: 10,
    verbose: false
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