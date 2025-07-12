import { spawn } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { createLLMClient, LLMClient } from '../utils/llmClient.js';

export interface FrameworkDetectionResult {
  framework: string;
  version?: string;
  confidence: number;
  pagePatterns: string[];
  componentPatterns: string[];
  configFiles: string[];
}

export interface PageComponentUsage {
  page: string;
  components: {
    name: string;
    type: 'component' | 'layout' | 'directive' | 'utility';
    usageContext: string;
  }[];
}

export interface IntelligentAnalysisResult {
  framework: FrameworkDetectionResult;
  projectStructure: string;
  relevantFiles: string[];
  pageComponentUsages: PageComponentUsage[];
  analysisLog: string[];
}

export class IntelligentAnalyzer {
  private projectPath: string;
  private analysisLog: string[] = [];
  private llmClient: LLMClient;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.llmClient = createLLMClient();
  }

  async analyze(): Promise<IntelligentAnalysisResult> {
    this.log('🧠 インテリジェント解析を開始します...');

    // Step 1: Detect framework using LLM
    const framework = await this.detectFramework();
    this.log(
      `🎯 検出されたフレームワーク: ${framework.framework} (信頼度: ${framework.confidence}%)`
    );

    // Step 2: Get project structure with tree command
    const projectStructure = await this.getProjectStructure();
    this.log(
      `📂 プロジェクト構造を取得しました (${projectStructure.split('\n').length} lines)`
    );

    // Step 3: Identify relevant files using LLM and framework knowledge
    const relevantFiles = await this.identifyRelevantFiles(
      framework,
      projectStructure
    );
    this.log(`📄 関連ファイルを特定しました: ${relevantFiles.length} files`);

    // Step 4: Analyze page-component relationships using LLM
    const pageComponentUsages = await this.analyzePageComponentUsages(
      framework,
      relevantFiles
    );
    this.log(
      `🔍 ページ-コンポーネント関係を解析しました: ${pageComponentUsages.length} pages`
    );

    return {
      framework,
      projectStructure,
      relevantFiles,
      pageComponentUsages,
      analysisLog: this.analysisLog,
    };
  }

  private async detectFramework(): Promise<FrameworkDetectionResult> {
    this.log('🔍 フレームワーク検出中...');

    // Read key configuration files to understand the project
    const configFiles = [
      'package.json',
      'nuxt.config.js',
      'nuxt.config.ts',
      'next.config.js',
      'next.config.ts',
      'vite.config.js',
      'vite.config.ts',
      'vue.config.js',
      'angular.json',
      'svelte.config.js',
    ];
    const projectInfo: string[] = [];

    for (const configFile of configFiles) {
      try {
        const content = await readFile(
          path.join(this.projectPath, configFile),
          'utf-8'
        );
        projectInfo.push(`=== ${configFile} ===\n${content}\n`);
      } catch (error) {
        // File doesn't exist, skip
      }
    }

    // Also check directory structure for framework indicators
    const structureHints = await this.getStructureHints();
    projectInfo.push(`=== Directory Structure Hints ===\n${structureHints}\n`);

    // Use LLM to detect framework with improved prompt
    const prompt = `
あなたはフロントエンドフレームワークの専門家です。以下のプロジェクト情報を分析して、使用されているフレームワークを正確に特定してください。

${projectInfo.join('\n')}

分析観点：
1. package.jsonの依存関係（dependencies, devDependencies）
2. 設定ファイルの存在とその内容
3. ディレクトリ構造（pages/, components/, app/, src/など）
4. フレームワーク固有のファイル命名規則

以下の形式で正確なJSONレスポンスを返してください：
{
  "framework": "フレームワーク名 (Nuxt.js, Next.js, Vue.js, React, Angular, Svelte, Vanilla)",
  "version": "バージョン情報 (package.jsonから取得可能な場合)",
  "confidence": 信頼度数値 (0-100),
  "pagePatterns": ["pages/**/*.vue", "pages/**/*.tsx", "src/app/**/*.tsx など、ページファイルのパターン"],
  "componentPatterns": ["components/**/*.vue", "components/**/*.tsx など、コンポーネントファイルのパターン"],
  "configFiles": ["重要な設定ファイル一覧"],
  "reasoning": "判定根拠の詳細説明"
}

注意：
- 必ずJSONフォーマットで回答してください
- framework名は正確に指定してください（略称は使用しない）
- confidenceは根拠の強さに基づいて設定してください
`;

    const llmResponse = await this.callLLM(prompt);
    try {
      // Clean the response to extract JSON (remove markdown code blocks)
      let cleanResponse = llmResponse.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(cleanResponse);
      this.log(`📋 判定根拠: ${result.reasoning || 'なし'}`);
      return result;
    } catch (error) {
      this.log(`⚠️ LLM応答の解析に失敗: ${error}`);
      this.log(`⚠️ LLM生応答: ${llmResponse}`);
      // Since we're using LLM-only framework detection, throw error instead of fallback
      throw new Error('LLM framework detection failed. Please check your API configuration.');
    }
  }

  private async getStructureHints(): Promise<string> {
    const importantDirs = [
      'pages',
      'components',
      'layouts',
      'src',
      'app',
      'public',
      'static',
    ];
    const hints: string[] = [];

    for (const dir of importantDirs) {
      try {
        const fullPath = path.join(this.projectPath, dir);
        const exists = await this.directoryExists(fullPath);
        if (exists) {
          hints.push(`✅ ${dir}/ exists`);
        }
      } catch (error) {
        // Directory doesn't exist
      }
    }

    return hints.join('\n');
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const { stat } = await import('fs/promises');
      const stats = await stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async getProjectStructure(): Promise<string> {
    this.log('📂 プロジェクト構造をtreeコマンドで取得中...');

    return new Promise((resolve, reject) => {
      const tree = spawn('tree', [
        this.projectPath,
        '-I',
        'node_modules|.git|.next|.nuxt|dist|build|coverage',
        '-L',
        '4', // Limit depth to 4 levels
        '--charset',
        'utf-8',
      ]);

      let output = '';
      let error = '';

      tree.stdout.on('data', (data) => {
        output += data.toString();
      });

      tree.stderr.on('data', (data) => {
        error += data.toString();
      });

      tree.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          this.log(`⚠️ treeコマンドが利用できません。fallbackを使用します。`);
          // Fallback: simple directory listing
          this.getSimpleDirectoryListing().then(resolve).catch(reject);
        }
      });

      tree.on('error', (err) => {
        this.log(`⚠️ treeコマンドエラー: ${err.message}`);
        this.getSimpleDirectoryListing().then(resolve).catch(reject);
      });
    });
  }

  private async getSimpleDirectoryListing(): Promise<string> {
    const { readdir, stat } = await import('fs/promises');

    const listDirectory = async (
      dirPath: string,
      level: number = 0,
      maxLevel: number = 3
    ): Promise<string[]> => {
      if (level > maxLevel) return [];

      const items: string[] = [];
      try {
        const entries = await readdir(dirPath);

        for (const entry of entries) {
          if (
            entry.startsWith('.') ||
            ['node_modules', 'dist', 'build'].includes(entry)
          )
            continue;

          const fullPath = path.join(dirPath, entry);
          const stats = await stat(fullPath);
          const indent = '  '.repeat(level);

          if (stats.isDirectory()) {
            items.push(`${indent}${entry}/`);
            const subItems = await listDirectory(fullPath, level + 1, maxLevel);
            items.push(...subItems);
          } else {
            items.push(`${indent}${entry}`);
          }
        }
      } catch (error) {
        // Skip directories we can't read
      }

      return items;
    };

    const listing = await listDirectory(this.projectPath);
    return listing.join('\n');
  }

  private async identifyRelevantFiles(
    framework: FrameworkDetectionResult,
    structure: string
  ): Promise<string[]> {
    this.log('📄 スマートファイル特定を開始...');

    // Use the new SmartFileSelector for more precise file selection
    const { SmartFileSelector } = await import('./smartFileSelector.js');
    const selector = new SmartFileSelector(this.projectPath);
    
    try {
      const selectionResult = await selector.selectRelevantFiles(framework, structure, {
        maxFiles: 25,
        prioritizeRecentFiles: true,
        includeConfigFiles: true
      });

      this.log(
        `📋 スマート選択結果: ${JSON.stringify(selectionResult.categorizedFiles, null, 2)}`
      );
      this.log(`🎯 選択信頼度: ${selectionResult.confidence}%`);

      // Log selection reasoning for key files
      Object.entries(selectionResult.selectionReasons).slice(0, 5).forEach(([file, reason]) => {
        this.log(`📝 ${file}: ${reason}`);
      });

      return selectionResult.selectedFiles;
    } catch (error) {
      this.log(`⚠️ スマートファイル選択に失敗、フォールバックを使用: ${error}`);
      return this.identifyRelevantFilesFallback(framework, structure);
    }
  }

  private async identifyRelevantFilesFallback(
    framework: FrameworkDetectionResult,
    structure: string
  ): Promise<string[]> {
    this.log('📄 フォールバック: 従来のファイル特定を実行...');

    const prompt = `
あなたは${framework.framework}プロジェクトの構造解析の専門家です。以下のプロジェクト構造を分析して、ページとコンポーネントの関係を分析するために必要なファイルを特定してください。

フレームワーク: ${framework.framework}
信頼度: ${framework.confidence}%

プロジェクト構造:
${structure}

重要な指示：
1. プロジェクト構造に表示されているファイルのみを選択してください
2. 存在しないファイルは絶対に含めないでください
3. ディレクトリの中身は構造表示で確認できるもののみ選択

分析対象として重要なファイル：
1. ページファイル（routes/pages/views）- .vue, .jsx, .tsx拡張子
2. コンポーネントファイル - components/内の.vue, .jsx, .tsx拡張子
3. レイアウトファイル - layouts/内のファイル
4. フレームワーク固有の重要ファイル

以下の形式で正確なJSONレスポンスを返してください：
{
  "files": [
    "実際に存在するファイルのプロジェクトルートからの相対パス"
  ],
  "categories": {
    "pages": ["実際に存在するページファイル一覧"],
    "components": ["実際に存在するコンポーネントファイル一覧"],
    "layouts": ["実際に存在するレイアウトファイル一覧"],
    "others": ["実際に存在するその他重要ファイル一覧"]
  },
  "reasoning": "選択理由とファイル分類の根拠",
  "validation": "プロジェクト構造表示で確認できるファイルのみを選択したことを確認"
}

注意：
- プロジェクト構造に明示的に表示されているファイルのみを選択
- 推測でファイルパスを作成しないでください
- ${framework.framework}の規約に従いつつ、実在するファイルのみ選択
- node_modules, .git, dist, .nuxtなどは除外
- 拡張子も含めて正確なパスを指定
`;

    const llmResponse = await this.callLLM(prompt);
    try {
      const result = JSON.parse(llmResponse);
      this.log(
        `📋 ファイル分類: ${JSON.stringify(result.categories, null, 2)}`
      );
      this.log(`📋 選択理由: ${result.reasoning}`);

      // Validate that files actually exist
      const validatedFiles = await this.validateFileExistence(result.files);
      this.log(
        `✅ 実存ファイル: ${validatedFiles.length}/${result.files.length}個が確認済み`
      );

      return validatedFiles;
    } catch (error) {
      this.log(`⚠️ ファイル特定でLLM応答の解析に失敗: ${error}`);
      this.log(`⚠️ LLM生応答: ${llmResponse}`);
      // Since we're using LLM-only analysis, throw error instead of fallback
      throw new Error('LLM file identification failed. Please check your API configuration.');
    }
  }

  private async validateFileExistence(files: string[]): Promise<string[]> {
    const { access } = await import('fs/promises');
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];

    this.log(`🔍 ${files.length}個のファイルの存在確認を開始...`);

    for (const file of files) {
      try {
        const filePath = path.join(this.projectPath, file);
        await access(filePath);
        validFiles.push(file);
      } catch (error) {
        invalidFiles.push(file);
        this.log(`❌ ファイル不存在: ${file}`);
      }
    }

    this.log(`✅ ${validFiles.length}個のファイルが存在確認済み`);
    this.log(`❌ ${invalidFiles.length}個のファイルが存在しません`);
    
    if (invalidFiles.length > 0) {
      this.log(`📋 存在しないファイル一覧:`);
      invalidFiles.forEach(file => this.log(`  - ${file}`));
      
      // 代替案の提案
      this.log(`🔍 代替案を検索中...`);
      const alternatives = await this.suggestAlternatives(invalidFiles);
      if (alternatives.length > 0) {
        this.log(`📝 代替案候補:`);
        alternatives.forEach(alt => this.log(`  - ${alt}`));
        const validAlternatives = await this.validateFileExistence(alternatives);
        validFiles.push(...validAlternatives);
      }
    }

    return validFiles;
  }

  /**
   * 存在しないファイルの代替案を提案
   */
  private async suggestAlternatives(invalidFiles: string[]): Promise<string[]> {
    const alternatives: string[] = [];
    
    for (const file of invalidFiles) {
      const baseName = path.basename(file, path.extname(file));
      const dirName = path.dirname(file);
      
      // 拡張子違いを試す
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue'];
      for (const ext of extensions) {
        if (!file.endsWith(ext)) {
          alternatives.push(path.join(dirName, baseName + ext));
        }
      }
      
      // ディレクトリ違いを試す
      if (dirName.includes('src')) {
        alternatives.push(file.replace('src/', ''));
      } else {
        alternatives.push(`src/${file}`);
      }
      
      // 大文字小文字違いを試す
      const upperBaseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
      const lowerBaseName = baseName.charAt(0).toLowerCase() + baseName.slice(1);
      
      if (baseName !== upperBaseName) {
        alternatives.push(path.join(dirName, upperBaseName + path.extname(file)));
      }
      if (baseName !== lowerBaseName) {
        alternatives.push(path.join(dirName, lowerBaseName + path.extname(file)));
      }
    }
    
    return [...new Set(alternatives)];
  }

  private async analyzePageComponentUsages(
    framework: FrameworkDetectionResult,
    files: string[]
  ): Promise<PageComponentUsage[]> {
    this.log('🔍 ページ-コンポーネント関係を解析中...');

    const usages: PageComponentUsage[] = [];
    const maxFilesPerBatch = 3; // Reduce batch size for more detailed analysis

    // Separate pages and components for focused analysis
    const pageFiles = files.filter((file) => this.isPageFile(file, framework));
    const componentFiles = files.filter((file) =>
      this.isComponentFile(file, framework)
    );

    this.log(
      `📊 ページファイル: ${pageFiles.length}個, コンポーネントファイル: ${componentFiles.length}個`
    );

    // Process page files individually for detailed analysis
    for (const pageFile of pageFiles) {
      const pageUsage = await this.analyzeIndividualPage(
        framework,
        pageFile,
        componentFiles
      );
      if (pageUsage) {
        usages.push(pageUsage);
      }
    }

    return usages;
  }

  private isPageFile(
    file: string,
    framework: FrameworkDetectionResult
  ): boolean {
    const pagePatterns = framework.pagePatterns || [];
    return (
      pagePatterns.some((pattern) => {
        const regex = new RegExp(
          pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
        );
        return regex.test(file);
      }) ||
      file.includes('/pages/') ||
      file.includes('/views/') ||
      file.includes('/routes/')
    );
  }

  private isComponentFile(
    file: string,
    framework: FrameworkDetectionResult
  ): boolean {
    const componentPatterns = framework.componentPatterns || [];
    return (
      componentPatterns.some((pattern) => {
        const regex = new RegExp(
          pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
        );
        return regex.test(file);
      }) ||
      file.includes('/components/') ||
      file.includes('/layouts/')
    );
  }

  private async analyzeIndividualPage(
    framework: FrameworkDetectionResult,
    pageFile: string,
    allComponentFiles: string[]
  ): Promise<PageComponentUsage | null> {
    this.log(`🔍 個別ページ解析中: ${pageFile}`);

    try {
      // Resolve the correct file path - handle both relative and absolute paths
      let filePath: string;
      if (pageFile.startsWith('./')) {
        // Remove leading ./ and prepend project path
        filePath = path.join(this.projectPath, pageFile.substring(2));
      } else if (path.isAbsolute(pageFile)) {
        // Use absolute path as-is
        filePath = pageFile;
      } else {
        // Relative path from project root
        filePath = path.join(this.projectPath, pageFile);
      }

      const pageContent = await readFile(filePath, 'utf-8');

      const prompt = `
あなたは${framework.framework}の専門家です。以下のページファイルを詳細に分析して、使用されているコンポーネントを特定してください。

ページファイル: ${pageFile}
フレームワーク: ${framework.framework}

=== ページファイル内容 ===
${pageContent}

=== プロジェクト内の利用可能なコンポーネント一覧 ===
${allComponentFiles.join('\n')}

分析観点：
1. import/require文でインポートされているコンポーネント
2. テンプレート/JSX内で実際に使用されているコンポーネント
3. 動的コンポーネント（v-component, React.lazy等）
4. フレームワーク固有のコンポーネント使用パターン

以下の形式で正確なJSONレスポンスを返してください：
{
  "page": "${pageFile}",
  "components": [
    {
      "name": "コンポーネント名",
      "type": "component|layout|directive|utility",
      "importPath": "import文のパス（あれば）",
      "usageContext": "使用箇所の詳細（行番号、使用方法）",
      "isLocal": "プロジェクト内のコンポーネントかどうか (true/false)"
    }
  ],
  "analysis": {
    "totalComponents": "使用コンポーネント数",
    "frameworkSpecific": "フレームワーク固有の特徴",
    "complexity": "low|medium|high"
  }
}

注意：
- HTMLタグ（div, span, p等）は除外してください
- 外部NPMパッケージとローカルコンポーネントを区別してください
- ${framework.framework}固有の記法を考慮してください
- 実際に使用されているコンポーネントのみを含めてください
`;

      const llmResponse = await this.callLLM(prompt);
      const result = JSON.parse(llmResponse);

      this.log(
        `✅ ${pageFile}: ${result.components?.length || 0}個のコンポーネント使用`
      );
      return result;
    } catch (error) {
      this.log(`⚠️ ページ解析失敗 ${pageFile}: ${error}`);
      return null;
    }
  }

  private async analyzeBatchFiles(
    framework: FrameworkDetectionResult,
    files: string[]
  ): Promise<PageComponentUsage[]> {
    const fileContents: string[] = [];

    for (const file of files) {
      try {
        const content = await readFile(
          path.join(this.projectPath, file),
          'utf-8'
        );
        fileContents.push(`=== ${file} ===\n${content}\n`);
      } catch (error) {
        this.log(`⚠️ ファイル読み込み失敗: ${file}`);
      }
    }

    if (fileContents.length === 0) return [];

    const prompt = `
フレームワーク: ${framework.framework}

以下のファイル内容を分析して、各ページでどのコンポーネントが使用されているかを特定してください：

${fileContents.join('\n')}

以下の形式でJSONレスポンスを返してください：
{
  "pages": [
    {
      "page": "ページファイルパス",
      "components": [
        {
          "name": "コンポーネント名",
          "type": "component|layout|directive|utility",
          "usageContext": "使用場所の詳細（行番号や使用方法）"
        }
      ]
    }
  ]
}

注意：
- インポートされているコンポーネントと実際に使用されているコンポーネントを区別してください
- HTMLタグ（div, span等）は除外してください
- ${framework.framework}固有のコンポーネント形式を考慮してください
`;

    const llmResponse = await this.callLLM(prompt);
    try {
      const result = JSON.parse(llmResponse);
      return result.pages || [];
    } catch (error) {
      this.log(`⚠️ バッチ解析でLLM応答の解析に失敗: ${error}`);
      return [];
    }
  }

  private async callLLM(prompt: string): Promise<string> {
    this.log('🧠 LLMを呼び出し中...');
    try {
      return await this.llmClient.chat(prompt);
    } catch (error) {
      this.log(`⚠️ LLM API呼び出しエラー: ${error}`);
      throw error;
    }
  }


  private log(message: string): void {
    this.analysisLog.push(`${new Date().toISOString()}: ${message}`);
    console.log(message);
  }
}
