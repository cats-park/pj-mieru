import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import path from 'path';
import { createLLMClient } from '../utils/llmClient.js';
export class IntelligentAnalyzer {
    projectPath;
    analysisLog = [];
    llmClient;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.llmClient = createLLMClient();
    }
    async analyze() {
        this.log('🧠 インテリジェント解析を開始します...');
        // Step 1: Detect framework using LLM
        const framework = await this.detectFramework();
        this.log(`🎯 検出されたフレームワーク: ${framework.framework} (信頼度: ${framework.confidence}%)`);
        // Step 2: Get project structure with tree command
        const projectStructure = await this.getProjectStructure();
        this.log(`📂 プロジェクト構造を取得しました (${projectStructure.split('\n').length} lines)`);
        // Step 3: Identify relevant files using LLM and framework knowledge
        const relevantFiles = await this.identifyRelevantFiles(framework, projectStructure);
        this.log(`📄 関連ファイルを特定しました: ${relevantFiles.length} files`);
        // Step 4: Analyze page-component relationships using LLM
        const pageComponentUsages = await this.analyzePageComponentUsages(framework, relevantFiles);
        this.log(`🔍 ページ-コンポーネント関係を解析しました: ${pageComponentUsages.length} pages`);
        return {
            framework,
            projectStructure,
            relevantFiles,
            pageComponentUsages,
            analysisLog: this.analysisLog,
        };
    }
    async detectFramework() {
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
        const projectInfo = [];
        for (const configFile of configFiles) {
            try {
                const content = await readFile(path.join(this.projectPath, configFile), 'utf-8');
                projectInfo.push(`=== ${configFile} ===\n${content}\n`);
            }
            catch (error) {
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
            const result = JSON.parse(llmResponse);
            this.log(`📋 判定根拠: ${result.reasoning || 'なし'}`);
            return result;
        }
        catch (error) {
            this.log(`⚠️ LLM応答の解析に失敗: ${error}`);
            this.log(`⚠️ LLM生応答: ${llmResponse}`);
            // Since we're using LLM-only framework detection, throw error instead of fallback
            throw new Error('LLM framework detection failed. Please check your API configuration.');
        }
    }
    async getStructureHints() {
        const importantDirs = [
            'pages',
            'components',
            'layouts',
            'src',
            'app',
            'public',
            'static',
        ];
        const hints = [];
        for (const dir of importantDirs) {
            try {
                const fullPath = path.join(this.projectPath, dir);
                const exists = await this.directoryExists(fullPath);
                if (exists) {
                    hints.push(`✅ ${dir}/ exists`);
                }
            }
            catch (error) {
                // Directory doesn't exist
            }
        }
        return hints.join('\n');
    }
    async directoryExists(dirPath) {
        try {
            const { stat } = await import('fs/promises');
            const stats = await stat(dirPath);
            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }
    async getProjectStructure() {
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
                }
                else {
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
    async getSimpleDirectoryListing() {
        const { readdir, stat } = await import('fs/promises');
        const listDirectory = async (dirPath, level = 0, maxLevel = 3) => {
            if (level > maxLevel)
                return [];
            const items = [];
            try {
                const entries = await readdir(dirPath);
                for (const entry of entries) {
                    if (entry.startsWith('.') ||
                        ['node_modules', 'dist', 'build'].includes(entry))
                        continue;
                    const fullPath = path.join(dirPath, entry);
                    const stats = await stat(fullPath);
                    const indent = '  '.repeat(level);
                    if (stats.isDirectory()) {
                        items.push(`${indent}${entry}/`);
                        const subItems = await listDirectory(fullPath, level + 1, maxLevel);
                        items.push(...subItems);
                    }
                    else {
                        items.push(`${indent}${entry}`);
                    }
                }
            }
            catch (error) {
                // Skip directories we can't read
            }
            return items;
        };
        const listing = await listDirectory(this.projectPath);
        return listing.join('\n');
    }
    async identifyRelevantFiles(framework, structure) {
        this.log('📄 関連ファイルを特定中...');
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
            this.log(`📋 ファイル分類: ${JSON.stringify(result.categories, null, 2)}`);
            this.log(`📋 選択理由: ${result.reasoning}`);
            // Validate that files actually exist
            const validatedFiles = await this.validateFileExistence(result.files);
            this.log(`✅ 実存ファイル: ${validatedFiles.length}/${result.files.length}個が確認済み`);
            return validatedFiles;
        }
        catch (error) {
            this.log(`⚠️ ファイル特定でLLM応答の解析に失敗: ${error}`);
            this.log(`⚠️ LLM生応答: ${llmResponse}`);
            // Since we're using LLM-only analysis, throw error instead of fallback
            throw new Error('LLM file identification failed. Please check your API configuration.');
        }
    }
    async validateFileExistence(files) {
        const { access } = await import('fs/promises');
        const validFiles = [];
        for (const file of files) {
            try {
                const filePath = path.join(this.projectPath, file);
                await access(filePath);
                validFiles.push(file);
            }
            catch (error) {
                this.log(`⚠️ ファイル不存在: ${file}`);
            }
        }
        return validFiles;
    }
    async analyzePageComponentUsages(framework, files) {
        this.log('🔍 ページ-コンポーネント関係を解析中...');
        const usages = [];
        const maxFilesPerBatch = 3; // Reduce batch size for more detailed analysis
        // Separate pages and components for focused analysis
        const pageFiles = files.filter((file) => this.isPageFile(file, framework));
        const componentFiles = files.filter((file) => this.isComponentFile(file, framework));
        this.log(`📊 ページファイル: ${pageFiles.length}個, コンポーネントファイル: ${componentFiles.length}個`);
        // Process page files individually for detailed analysis
        for (const pageFile of pageFiles) {
            const pageUsage = await this.analyzeIndividualPage(framework, pageFile, componentFiles);
            if (pageUsage) {
                usages.push(pageUsage);
            }
        }
        return usages;
    }
    isPageFile(file, framework) {
        const pagePatterns = framework.pagePatterns || [];
        return (pagePatterns.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(file);
        }) ||
            file.includes('/pages/') ||
            file.includes('/views/') ||
            file.includes('/routes/'));
    }
    isComponentFile(file, framework) {
        const componentPatterns = framework.componentPatterns || [];
        return (componentPatterns.some((pattern) => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(file);
        }) ||
            file.includes('/components/') ||
            file.includes('/layouts/'));
    }
    async analyzeIndividualPage(framework, pageFile, allComponentFiles) {
        this.log(`🔍 個別ページ解析中: ${pageFile}`);
        try {
            // Resolve the correct file path - handle both relative and absolute paths
            let filePath;
            if (pageFile.startsWith('./')) {
                // Remove leading ./ and prepend project path
                filePath = path.join(this.projectPath, pageFile.substring(2));
            }
            else if (path.isAbsolute(pageFile)) {
                // Use absolute path as-is
                filePath = pageFile;
            }
            else {
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
            this.log(`✅ ${pageFile}: ${result.components?.length || 0}個のコンポーネント使用`);
            return result;
        }
        catch (error) {
            this.log(`⚠️ ページ解析失敗 ${pageFile}: ${error}`);
            return null;
        }
    }
    async analyzeBatchFiles(framework, files) {
        const fileContents = [];
        for (const file of files) {
            try {
                const content = await readFile(path.join(this.projectPath, file), 'utf-8');
                fileContents.push(`=== ${file} ===\n${content}\n`);
            }
            catch (error) {
                this.log(`⚠️ ファイル読み込み失敗: ${file}`);
            }
        }
        if (fileContents.length === 0)
            return [];
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
        }
        catch (error) {
            this.log(`⚠️ バッチ解析でLLM応答の解析に失敗: ${error}`);
            return [];
        }
    }
    async callLLM(prompt) {
        this.log('🧠 LLMを呼び出し中...');
        try {
            return await this.llmClient.chat(prompt);
        }
        catch (error) {
            this.log(`⚠️ LLM API呼び出しエラー: ${error}`);
            throw error;
        }
    }
    log(message) {
        this.analysisLog.push(`${new Date().toISOString()}: ${message}`);
        console.log(message);
    }
}
//# sourceMappingURL=intelligentAnalyzer.js.map