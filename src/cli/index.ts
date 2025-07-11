#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { BaseAnalyzer } from '../core/baseAnalyzer.js';
import { ErrorHandler } from '../core/errorHandler.js';
import { PageAnalyzer } from '../analyzer/pageAnalyzer.js';
import { IntelligentAnalyzer } from '../analyzer/intelligentAnalyzer.js';
import { IntelligentMermaidGenerator } from '../generators/intelligentMermaidGenerator.js';
import { writeFile } from 'fs/promises';
import { resolveProjectPath, isGitHubUrl } from '../utils/githubHelper.js';
import { TechStackAnalyzer } from '../analyzer/techStackAnalyzer.js';

const program = new Command();

// Version and basic info
program
  .name('mieru')
  .description('Vue.js、React、Nuxt.js等のプロジェクト構造を可視化するツール')
  .version('1.0.0');

// Analyze command
program
  .command('analyze')
  .description('プロジェクトを解析してコンポーネント/ページ構造を可視化する')
  .argument('<path>', 'プロジェクトのパス (ローカルパス または GitHub URL)')
  .option(
    '--format <type>',
    '出力形式 (intelligent, page-structure, page-component)',
    'intelligent'
  )
  .option(
    '--output <name>',
    '出力ファイル名のプレフィックス',
    'analysis-report'
  )
  .option('--group-by-directory', 'ディレクトリでグループ化する', false)
  .option('--show-usage-context', '使用コンテキストを表示する', false)
  .option(
    '--diagram-type <type>',
    'ダイアグラムタイプ (enhanced, simple)',
    'enhanced'
  )
  .action(async (inputPath: string, options) => {
    const isGitHub = isGitHubUrl(inputPath);
    console.log(`🔍 プロジェクトを解析中: ${inputPath}`);
    console.log(`📊 出力形式: ${options.format}`);
    console.log(`🌐 ソース: ${isGitHub ? 'GitHub リポジトリ' : 'ローカルディレクトリ'}`);

    let resolvedPath: { path: string; isTemporary: boolean; cleanup?: () => Promise<void> } | null = null;

    try {
      // パスを解決（GitHub URLまたはローカルパス）
      resolvedPath = await resolveProjectPath(inputPath);
      const projectPath = resolvedPath.path;

      switch (options.format) {
        case 'intelligent':
          await analyzeIntelligently(projectPath, options, inputPath);
          break;
        case 'page-structure':
          await analyzePageStructure(projectPath, options, inputPath);
          break;
        case 'page-component':
          await analyzePageComponents(projectPath, options, inputPath);
          break;
        default:
          // デフォルトはintelligent解析
          await analyzeIntelligently(projectPath, options, inputPath);
          break;
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

async function analyzePageStructure(projectPath: string, options: any, originalInputPath: string) {
  // 基本解析を実行
  const baseAnalyzer = new BaseAnalyzer();
  const { scanResult, astResults, vueResults } =
    await baseAnalyzer.analyzeProject(projectPath, {
      verbose: true,
    });

  console.log('🔍 技術スタックを解析中...');

  // 技術スタック解析を実行
  const techStackAnalyzer = new TechStackAnalyzer();
  const techStack = await techStackAnalyzer.analyzeTechStack(projectPath, scanResult.files);

  console.log('📄 ページ構造を解析中...');

  // ページ解析を実行
  const analyzer = new PageAnalyzer();
  const result = await analyzer.analyzePages(
    scanResult.files,
    astResults,
    vueResults
  );

  // Create a simple mermaid diagram with subgraphs
  const mermaidLines = [
    '```mermaid',
    'flowchart LR',
    '',
    '%% ページ構造図',
    '',
  ];

  // Add pages as subgraphs with components inside
  let pageIndex = 1;
  result.pages.forEach((page, path) => {
    const pageId = `page${pageIndex++}`;
    // Use relative path from src/ for cleaner display
    const displayPath = path.includes('/src/') ? path.split('/src/')[1] : path;

    mermaidLines.push(`  subgraph ${pageId} ["📄 ${displayPath}"]`);

    // Add components inside the subgraph with nesting
    if (page.components.length > 0) {
      const componentGroups = groupComponentsByParent(page.components);

      generateNestedComponents(mermaidLines, componentGroups, pageId);
    } else {
      // Add invisible placeholder to maintain subgraph styling
      mermaidLines.push(`    ${pageId}_placeholder[" "]`);
      mermaidLines.push(
        `    style ${pageId}_placeholder fill:transparent,stroke:transparent`
      );
    }

    mermaidLines.push('  end');

    // Add page styling (green theme)
    mermaidLines.push(
      `  style ${pageId} fill:#E8F5E8,stroke:#4CAF50,color:#2E7D32`
    );
    mermaidLines.push('');
  });

  mermaidLines.push('```');
  const mermaidDiagram = mermaidLines.join('\n');

  // 参照元リンクの生成
  const sourceLink = isGitHubUrl(originalInputPath) 
    ? `[${originalInputPath}](${originalInputPath})`
    : `\`${originalInputPath}\``;

  // Create a detailed markdown report with tech stack info
  const markdownLines = [
    '# ページ構造解析レポート',
    '',
    `**生成日時**: ${new Date().toLocaleString('ja-JP')}`,
    `**参照元**: ${sourceLink}`,
    '',
    '## 🚀 技術スタック',
    '',
    `### 主要技術`,
    `- **言語**: ${techStack.primaryLanguage}`,
    `- **フレームワーク**: ${techStack.primaryFramework}`,
    `- **パッケージマネージャー**: ${techStack.packageManager}`,
    '',
    '### 言語構成',
    ...techStack.languages.slice(0, 5).map(lang => 
      `- **${lang.name}**: ${lang.percentage}% (${lang.fileCount}ファイル)`
    ),
    '',
    '### フレームワーク/ライブラリ',
    ...techStack.frameworks.map(fw => 
      `- **${fw.name}**${fw.version ? ` v${fw.version}` : ''} (信頼度: ${fw.confidence})`
    ),
    '',
    ...(techStack.buildTools.length > 0 ? [
      '### ビルドツール',
      ...techStack.buildTools.map(tool => 
        `- **${tool.name}**${tool.version ? ` v${tool.version}` : ''}`
      ),
      ''
    ] : []),
    '## 📊 統計情報',
    '',
    `- **総ページ数**: ${result.pages.size}`,
    `- **総コンポーネント数**: ${result.stats.totalComponents}`,
    `- **解析時間**: ${result.stats.analysisTime}ms`,
    '',
    '## 🗺️ プロジェクト構造図',
    '',
    mermaidDiagram,
  ];

  const markdownReport = markdownLines.join('\n');
  const outputPath = `${options.output}-pages.md`;

  await writeFile(outputPath, markdownReport);
  console.log(`✅ ページ構造図を生成しました: ${outputPath}`);
  console.log(
    `🚀 技術スタック: ${techStack.primaryLanguage} + ${techStack.primaryFramework}`
  );
  console.log(
    `📊 統計: ${result.pages.size} ページ, ${result.stats.totalComponents} コンポーネント`
  );
}

async function analyzeIntelligently(projectPath: string, options: any, originalInputPath: string) {
  console.log('🧠 インテリジェント解析を開始します...');
  console.log(
    '⚠️  この機能はLLM APIキーが必要です (.env ファイルで設定してください)'
  );

  try {
    const analyzer = new IntelligentAnalyzer(projectPath);
    const result = await analyzer.analyze();

    const generator = new IntelligentMermaidGenerator({
      title: 'インテリジェント プロジェクト解析',
      showFrameworkInfo: true,
      showComponentTypes: true,
      showUsageContext: options.showUsageContext,
      groupByDirectory: options.groupByDirectory,
    });

    const markdownReport = generator.generateMarkdownReport(result);
    const outputPath = `${options.output}-intelligent.md`;

    await writeFile(outputPath, markdownReport);
    console.log(`✅ インテリジェント解析レポートを生成しました: ${outputPath}`);
    console.log(
      `🎯 検出フレームワーク: ${result.framework.framework} (信頼度: ${result.framework.confidence}%)`
    );
    console.log(
      `📊 統計: ${result.pageComponentUsages.length} ページ, ${result.pageComponentUsages.reduce((sum, page) => sum + page.components.length, 0)} コンポーネント`
    );

    // Also output the analysis log
    const logPath = `${options.output}-analysis.log`;
    await writeFile(logPath, result.analysisLog.join('\n'));
    console.log(`📝 解析ログを出力しました: ${logPath}`);
  } catch (error) {
    console.error('❌ インテリジェント解析に失敗しました:');
    ErrorHandler.handleError(error);
  }
}

async function analyzePageComponents(projectPath: string, options: any, originalInputPath: string) {
  console.log('🧠 LLMベースのページ-コンポーネント解析を開始します...');
  console.log(
    '⚠️  この機能はLLM APIキーが必要です (.env ファイルで設定してください)'
  );

  try {
    const analyzer = new IntelligentAnalyzer(projectPath);
    const result = await analyzer.analyze();

    const generator = new IntelligentMermaidGenerator({
      title: 'ページ-コンポーネント関係図',
      showFrameworkInfo: true,
      showComponentTypes: true,
      showUsageContext: options.showUsageContext,
      groupByDirectory: options.groupByDirectory,
    });

    // Generate both diagram types
    let diagram: string;
    if (options.diagramType === 'simple') {
      diagram = generator.generatePageComponentDiagram(result);
    } else {
      diagram = generator.generateDiagram(result);
    }

    // 参照元リンクの生成
    const sourceLink = isGitHubUrl(originalInputPath) 
      ? `[${originalInputPath}](${originalInputPath})`
      : `\`${originalInputPath}\``;

    // Create enhanced report with both diagrams
    const markdownReport = `# ページ-コンポーネント関係解析レポート

**生成日時**: ${new Date().toLocaleString('ja-JP')}
**参照元**: ${sourceLink}

## 🚀 検出されたフレームワーク

- **フレームワーク**: ${result.framework.framework}
${result.framework.version ? `- **バージョン**: ${result.framework.version}` : ''}
- **信頼度**: ${result.framework.confidence}%

## 📊 統計情報

- **総ページ数**: ${result.pageComponentUsages.length}
- **総コンポーネント使用数**: ${result.pageComponentUsages.reduce((sum, page) => sum + page.components.length, 0)}
- **解析対象ファイル数**: ${result.relevantFiles.length}

## 🗺️ ページ-コンポーネント関係図

${diagram}

## 📄 詳細内訳

${result.pageComponentUsages
  .map((page) => {
    const pageDisplayName =
      page.page
        .split('/')
        .pop()
        ?.replace(/\.(vue|jsx?|tsx?)$/i, '') || 'page';

    let section = `### ${pageDisplayName}\n\n`;
    section += `**ファイルパス**: \`${page.page}\`\n\n`;

    if (page.components.length > 0) {
      section += '**使用コンポーネント**:\n';
      page.components.forEach((component) => {
        const typeIcon = getComponentTypeIcon(component.type);
        let componentLine = `- ${typeIcon} **${component.name}** (${component.type})`;

        if (options.showUsageContext && component.usageContext) {
          componentLine += ` - ${component.usageContext}`;
        }

        section += componentLine + '\n';
      });
    } else {
      section += '**使用コンポーネント**: なし\n';
    }

    section += '\n';
    return section;
  })
  .join('')}

## 🔍 解析ログ

\`\`\`
${result.analysisLog.join('\n')}
\`\`\`
`;

    const outputPath = `${options.output}-page-components.md`;

    await writeFile(outputPath, markdownReport);
    console.log(
      `✅ ページ-コンポーネント解析レポートを生成しました: ${outputPath}`
    );
    console.log(
      `🎯 検出フレームワーク: ${result.framework.framework} (信頼度: ${result.framework.confidence}%)`
    );
    console.log(
      `📊 統計: ${result.pageComponentUsages.length} ページ, ${result.pageComponentUsages.reduce((sum, page) => sum + page.components.length, 0)} コンポーネント使用`
    );

    // Also output the analysis log
    const logPath = `${options.output}-page-components.log`;
    await writeFile(logPath, result.analysisLog.join('\n'));
    console.log(`📝 解析ログを出力しました: ${logPath}`);
  } catch (error) {
    console.error('❌ ページ-コンポーネント解析に失敗しました:');
    ErrorHandler.handleError(error);
  }
}

function getComponentTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    component: '🧩',
    layout: '📐',
    directive: '⚡',
    utility: '🛠️',
  };
  return iconMap[type] || '📦';
}

function groupComponentsByParent(components: any[]): {
  parents: any[];
  children: Map<string, any[]>;
} {
  const parents: any[] = [];
  const children = new Map<string, any[]>();

  components.forEach((comp) => {
    if (!comp.parent) {
      parents.push(comp);
    } else {
      if (!children.has(comp.parent)) {
        children.set(comp.parent, []);
      }
      children.get(comp.parent)!.push(comp);
    }
  });

  return { parents, children };
}

function generateNestedComponents(
  mermaidLines: string[],
  componentGroups: { parents: any[]; children: Map<string, any[]> },
  pageId: string
): void {
  let componentIndex = 0;

  componentGroups.parents.forEach((parent) => {
    const parentId = `${pageId}_c${componentIndex++}`;
    const childComponents = componentGroups.children.get(parent.name) || [];

    if (childComponents.length > 0) {
      // Parent component with children - make it a subgraph
      mermaidLines.push(`    subgraph ${parentId} ["🧩 ${parent.name}"]`);

      childComponents.forEach((child) => {
        const childId = `${parentId}_child${componentIndex++}`;
        mermaidLines.push(`      ${childId}["🧩 ${child.name}"]`);
        // Add styling for child component (darker blue - more intense)
        mermaidLines.push(
          `      style ${childId} fill:#2E5A8A,stroke:#1E3D5C,color:#FFFFFF`
        );
      });

      mermaidLines.push('    end');

      // Add styling for parent component (darker blue)
      mermaidLines.push(
        `    style ${parentId} fill:#4A90E2,stroke:#2E5A8A,color:#FFFFFF`
      );
    } else {
      // Parent component without children - regular node
      mermaidLines.push(`    ${parentId}["🧩 ${parent.name}"]`);
      // Add styling for regular component (light blue)
      mermaidLines.push(
        `    style ${parentId} fill:#7BB3F0,stroke:#4A90E2,color:#FFFFFF`
      );
    }
  });
}

async function initConfig(force?: boolean): Promise<void> {
  const configPath = path.join(process.cwd(), 'mieru.config.js');

  if (fs.existsSync(configPath) && !force) {
    throw new Error(
      'Configuration file already exists. Use --force to overwrite.'
    );
  }

  const defaultConfig = `module.exports = {
  // Include pages in analysis
  includePages: true,
  
  // Include components in analysis
  includeComponents: true,
  
  // Show dependency relationships
  showDependencies: true,
  
  // Maximum dependency depth to analyze
  maxDepth: 10,
  
  // Patterns to exclude from analysis
  excludePatterns: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  
  // Output configuration
  output: {
    format: 'html',
    filename: 'mieru-report.html'
  }
};
`;

  fs.writeFileSync(configPath, defaultConfig);
  console.log(`✅ Configuration file created: ${configPath}`);
}

export function runCLI(args?: string[]): void {
  if (args) {
    program.parse(args);
  } else {
    program.parse();
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run CLI if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI();
}
