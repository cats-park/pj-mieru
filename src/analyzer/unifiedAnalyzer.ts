import { createLLMClient, LLMClient } from '../utils/llmClient.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { ScannedFile } from '../types/scanner.js';
import { fileScanner } from './fileScanner.js';

export interface FrameworkInfo {
  name: string;
  version?: string;
  confidence: number;
  pagePatterns: string[];
  componentPatterns: string[];
}

export interface PageInfo {
  name: string;
  filePath: string;
  route: string;
  components: ComponentInfo[];
  reason: string;
}

export interface ComponentInfo {
  name: string;
  type: 'component' | 'layout' | 'utility' | 'hook';
  filePath?: string;
  children: ComponentInfo[];
}

export interface UnifiedAnalysisResult {
  framework: FrameworkInfo;
  pages: PageInfo[];
  totalFiles: number;
  analysisTime: number;
  analysisLog: string[];
  tokenUsage: {
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    llmCalls: number;
  };
}

export class UnifiedAnalyzer {
  private projectPath: string;
  private llmClient: LLMClient;
  private analysisLog: string[] = [];
  private startTime: number = 0;
  private tokenUsage = {
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
    llmCalls: 0
  };

  constructor(projectPath: string, options?: { apiKey?: string }) {
    this.projectPath = projectPath;
    this.llmClient = createLLMClient(options?.apiKey);
  }

  async analyze(): Promise<UnifiedAnalysisResult> {
    this.startTime = Date.now();
    this.log('🚀 統合解析を開始します...');

    try {
      // Step 1: プロジェクト構造とフレームワークを解析
      const framework = await this.detectFramework();
      this.log(`🎯 フレームワーク検出: ${framework.name} (信頼度: ${framework.confidence}%)`);

      // Step 2: ファイルをスキャン
      const files = await this.scanFiles();
      this.log(`📂 ファイルスキャン完了: ${files.length}個のファイル`);

      // Step 3: ページファイルを高精度で特定
      const pages = await this.identifyPages(files, framework);
      this.log(`📄 ページ特定完了: ${pages.length}個のページ`);

      // Step 4: 各ページのコンポーネントを再帰的に解析
      await this.analyzePageComponents(pages, files, framework);
      this.log(`🔍 コンポーネント解析完了`);

      const analysisTime = Date.now() - this.startTime;
      
      return {
        framework,
        pages,
        totalFiles: files.length,
        analysisTime,
        analysisLog: this.analysisLog,
        tokenUsage: this.tokenUsage
      };
    } catch (error) {
      this.log(`❌ 解析中にエラーが発生しました: ${error}`);
      throw error;
    }
  }

  private async scanFiles(): Promise<ScannedFile[]> {
    const scanResult = await fileScanner.scanProject(this.projectPath, {
      maxDepth: 10,
      includeHidden: false,
    });
    return scanResult.files;
  }

  private async detectFramework(): Promise<FrameworkInfo> {
    this.log('🔍 フレームワーク検出中...');

    // 設定ファイルを読み込み
    const configFiles = [
      'package.json',
      'next.config.js',
      'next.config.ts',
      'nuxt.config.js',
      'nuxt.config.ts',
      'vue.config.js',
      'vite.config.js',
      'vite.config.ts'
    ];

    const configInfo: string[] = [];
    for (const file of configFiles) {
      try {
        const content = await readFile(path.join(this.projectPath, file), 'utf-8');
        configInfo.push(`=== ${file} ===\n${content.slice(0, 2000)}\n`);
      } catch {
        // ファイルが存在しない場合はスキップ
      }
    }

    // ディレクトリ構造も確認
    const structureHints = await this.getStructureHints();
    
    const prompt = `You are a frontend framework expert. Identify the framework from the following project information.

Config files:
${configInfo.join('\n')}

Directory structure:
${structureHints}

Return ONLY valid JSON in this exact format:
{
  "name": "Framework name (React, Vue.js, Next.js, Nuxt.js)",
  "version": "Version if available",
  "confidence": 85,
  "pagePatterns": ["Array of page file patterns"],
  "componentPatterns": ["Array of component file patterns"]
}`;

    const response = await this.llmClient.chatWithUsage(prompt);
    this.trackTokenUsage(response.usage);
    
    try {
      // More robust JSON cleaning
      let cleanResponse = response.content.trim();
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/\s*```/g, '');
      
      // Find JSON object
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanResponse);
    } catch (error) {
      this.log(`⚠️ LLM応答の解析に失敗しました: ${error}`);
      // フォールバック: package.json から推測
      return await this.detectFrameworkFallback();
    }
  }

  private async detectFrameworkFallback(): Promise<FrameworkInfo> {
    try {
      const packageJson = await readFile(path.join(this.projectPath, 'package.json'), 'utf-8');
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['next']) {
        return {
          name: 'Next.js',
          version: deps['next'],
          confidence: 90,
          pagePatterns: ['pages/**/*.{js,jsx,ts,tsx}', 'app/**/*.{js,jsx,ts,tsx}'],
          componentPatterns: ['components/**/*.{js,jsx,ts,tsx}']
        };
      }

      if (deps['nuxt']) {
        return {
          name: 'Nuxt.js',
          version: deps['nuxt'],
          confidence: 90,
          pagePatterns: ['pages/**/*.vue', 'app/**/*.vue'],
          componentPatterns: ['components/**/*.vue']
        };
      }

      if (deps['vue']) {
        return {
          name: 'Vue.js',
          version: deps['vue'],
          confidence: 85,
          pagePatterns: ['src/views/**/*.vue', 'src/pages/**/*.vue'],
          componentPatterns: ['src/components/**/*.vue']
        };
      }

      if (deps['react']) {
        return {
          name: 'React',
          version: deps['react'],
          confidence: 85,
          pagePatterns: ['src/pages/**/*.{js,jsx,ts,tsx}', 'src/views/**/*.{js,jsx,ts,tsx}'],
          componentPatterns: ['src/components/**/*.{js,jsx,ts,tsx}']
        };
      }

      return {
        name: 'Unknown',
        confidence: 0,
        pagePatterns: [],
        componentPatterns: []
      };
    } catch {
      return {
        name: 'Unknown',
        confidence: 0,
        pagePatterns: [],
        componentPatterns: []
      };
    }
  }

  private async getStructureHints(): Promise<string> {
    const dirs = ['pages', 'app', 'src', 'components', 'views', 'layouts'];
    const hints: string[] = [];

    for (const dir of dirs) {
      try {
        const { stat } = await import('fs/promises');
        await stat(path.join(this.projectPath, dir));
        hints.push(`✅ ${dir}/`);
      } catch {
        hints.push(`❌ ${dir}/`);
      }
    }

    return hints.join('\n');
  }

  private async identifyPages(files: ScannedFile[], framework: FrameworkInfo): Promise<PageInfo[]> {
    this.log('📄 ページファイルを特定中...');

    // フレームワークごとのページ検出パターンを使用
    const pagePatterns = framework.pagePatterns || [];
    
    // 基本的なページ検出ロジック
    const pageFiles = files.filter(file => {
      // node_modules や テスト関連ファイルは除外
      if (file.path.includes('node_modules') ||
          file.path.includes('.test.') ||
          file.path.includes('.spec.') ||
          file.path.includes('.stories.') ||
          file.path.includes('__tests__') ||
          file.path.includes('test/') ||
          file.path.includes('tests/')) {
        return false;
      }

      // フレームワークごとの検出パターンをチェック
      const isPageFile = this.isPageFile(file, framework);
      
      if (isPageFile) {
        this.log(`📄 ページファイル検出: ${file.relativePath}`);
      }
      
      return isPageFile;
    });

    if (pageFiles.length === 0) {
      this.log('⚠️ ページファイルが見つかりませんでした');
      return [];
    }

    this.log(`📄 ${pageFiles.length}個のページファイルを検出しました`);

    const pages: PageInfo[] = [];

    for (const file of pageFiles) {
      const pageName = this.generatePageName(file.relativePath);
      const route = this.generateRoute(file.relativePath);
      
      pages.push({
        name: pageName,
        filePath: file.relativePath,
        route: route,
        components: [],
        reason: `このファイルは${framework.name}プロジェクトのページファイルとして認識されました。（${file.relativePath}）`
      });
    }

    return pages;
  }

  private isPageFile(file: ScannedFile, framework: FrameworkInfo): boolean {
    const { name, relativePath } = file;
    
    // Vue.js / Nuxt.js のページ検出
    if (framework.name === 'Vue.js' || framework.name === 'Nuxt.js') {
      return /\.vue$/.test(name) && 
             (relativePath.includes('pages/') || relativePath.includes('src/pages/'));
    }
    
    // Next.js のページ検出
    if (framework.name === 'Next.js') {
      return /\.(js|jsx|ts|tsx)$/.test(name) && 
             (relativePath.includes('pages/') || relativePath.includes('app/') || 
              relativePath.includes('src/pages/') || relativePath.includes('src/app/'));
    }
    
    // React のページ検出
    if (framework.name === 'React') {
      // App.jsはページではなくルートコンポーネントなので除外
      if (/^App\.(js|jsx|ts|tsx)$/.test(name)) {
        return false;
      }
      
      // Screen/screensディレクトリ内のファイルを優先的にページとして認識（ただし、深いネストは除く）
      if ((relativePath.includes('screens/') || relativePath.includes('src/screens/') ||
           relativePath.includes('Screen/') || relativePath.includes('src/Screen/')) && 
          /\.(js|jsx|ts|tsx)$/.test(name)) {
        
        // 深いネスト（サブディレクトリのサブディレクトリ）内のファイルは除外
        // 例：src/Screen/HomeScreen/HomeBanner/homeBanner.js は除外
        const screenPath = relativePath.includes('src/Screen/') ? 
          relativePath.split('src/Screen/')[1] : 
          relativePath.split('Screen/')[1] || relativePath.split('screens/')[1] || relativePath.split('src/screens/')[1];
        
        if (screenPath) {
          const pathParts = screenPath.split('/');
          // Screen直下（最大1レベル深）のファイルのみページとして認識
          // 例：Screen/HomeScreen/homeScreen.js は OK、Screen/HomeScreen/HomeBanner/homeBanner.js は NG
          if (pathParts.length <= 2) {
            return true;
          }
        }
      }
      
      // pagesディレクトリ内のファイル
      if ((relativePath.includes('pages/') || relativePath.includes('src/pages/')) && 
          /\.(js|jsx|ts|tsx)$/.test(name)) {
        return true;
      }
      
      // viewsディレクトリ内のファイル
      if ((relativePath.includes('views/') || relativePath.includes('src/views/')) && 
          /\.(js|jsx|ts|tsx)$/.test(name)) {
        return true;
      }
      
      // routesディレクトリ内のファイル
      if ((relativePath.includes('routes/') || relativePath.includes('src/routes/')) && 
          /\.(js|jsx|ts|tsx)$/.test(name)) {
        return true;
      }
      
      // Screen/Screens で終わるファイル名をページとして認識
      if (/Screen\.(js|jsx|ts|tsx)$/.test(name)) {
        return true;
      }
    }
    
    return false;
  }

  private generatePageName(filePath: string): string {
    // ファイルパスからページ名を生成
    let name = filePath
      .replace(/^src\/pages\//, '')
      .replace(/^pages\//, '')
      .replace(/^src\/views\//, '')
      .replace(/^views\//, '')
      .replace(/^src\/screens\//, '')
      .replace(/^screens\//, '')
      .replace(/^src\/routes\//, '')
      .replace(/^routes\//, '')
      .replace(/^src\/app\//, '')
      .replace(/^app\//, '')
      .replace(/^src\/Screen\//, '')  // Screen ディレクトリも対応
      .replace(/^Screen\//, '')
      .replace(/\.(vue|jsx?|tsx?)$/, '')  // 複数の拡張子に対応
      .replace(/\/index$/, '');

    // App.jsのようなルートファイルの場合
    if (name === 'App' || name === 'app') {
      return 'App';
    }

    // Screen名の処理（例：HomeScreen/homeScreen -> Home Screen）
    if (name.includes('/')) {
      const parts = name.split('/');
      const lastPart = parts[parts.length - 1];
      const parentDir = parts[parts.length - 2];
      
      // 親ディレクトリとファイル名が似ている場合は親ディレクトリ名を使用
      if (parentDir && lastPart.toLowerCase().includes(parentDir.toLowerCase())) {
        name = parentDir;
      } else {
        name = lastPart;
      }
    }

    // Screen suffix を除去
    name = name.replace(/Screen$/, '');

    // camelCaseやPascalCaseを単語に分割
    name = name.replace(/([a-z])([A-Z])/g, '$1 $2');

    // 最初の文字を大文字に
    name = name.charAt(0).toUpperCase() + name.slice(1);

    return name || 'Home';
  }

  private generateRoute(filePath: string): string {
    // ファイルパスからルートを生成
    let route = filePath
      .replace(/^src\/pages\//, '')
      .replace(/^pages\//, '')
      .replace(/^src\/views\//, '')
      .replace(/^views\//, '')
      .replace(/^src\/screens\//, '')
      .replace(/^screens\//, '')
      .replace(/^src\/routes\//, '')
      .replace(/^routes\//, '')
      .replace(/^src\/app\//, '')
      .replace(/^app\//, '')
      .replace(/^src\/Screen\//, '')  // Screen ディレクトリも対応
      .replace(/^Screen\//, '')
      .replace(/\.(vue|jsx?|tsx?)$/, '')  // 複数の拡張子に対応
      .replace(/\/index$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1');

    // Screen名の処理（例：HomeScreen/homeScreen -> homescreen）
    if (route.includes('/')) {
      const parts = route.split('/');
      const lastPart = parts[parts.length - 1];
      const parentDir = parts[parts.length - 2];
      
      // 親ディレクトリとファイル名が似ている場合は親ディレクトリ名を使用
      if (parentDir && lastPart.toLowerCase().includes(parentDir.toLowerCase())) {
        route = parentDir.toLowerCase();
      } else {
        route = lastPart.toLowerCase();
      }
    }

    // Screen suffix を除去
    route = route.replace(/screen$/i, '');

    // App.jsのようなルートファイルの場合
    if (route === 'App' || route === 'app' || route === '') {
      return '/';
    }

    // 特別なルート名の処理
    if (route === 'home') {
      return '/';
    }

    // ルートパスの調整
    return '/' + route;
  }

  private async analyzePageComponents(pages: PageInfo[], files: ScannedFile[], framework: FrameworkInfo): Promise<void> {
    this.log('🔍 ページコンポーネントを解析中...');

    for (const page of pages) {
      try {
        // ページファイルを見つける
        const pageFile = files.find(f => f.relativePath === page.filePath);
        if (!pageFile) {
          this.log(`⚠️ ページファイルが見つかりません: ${page.filePath}`);
          continue;
        }

        // ページファイルの内容を読み込み
        const content = await readFile(pageFile.path, 'utf-8');
        
        // 再帰的にコンポーネントを解析
        const visitedComponents = new Set<string>();
        const components = await this.extractComponentsRecursively(
          content, 
          page.name, 
          framework, 
          files, 
          visitedComponents, 
          0, // 深度
          5, // 最大深度
          [] // 現在のパス
        );
        page.components = components;

        this.log(`📄 ${page.name}: ${this.countTotalComponents(components)}個のコンポーネント`);
      } catch (error) {
        this.log(`❌ ${page.name}の解析に失敗: ${error}`);
      }
    }
  }

  private async extractComponentsRecursively(
    content: string,
    componentName: string,
    framework: FrameworkInfo,
    files: ScannedFile[],
    visitedComponents: Set<string>,
    depth: number,
    maxDepth: number = 5,
    currentPath: string[] = []
  ): Promise<ComponentInfo[]> {
    // 深度制限チェック
    if (depth > maxDepth) {
      this.log(`⚠️ 最大深度 ${maxDepth} に到達: ${componentName}`);
      return [];
    }

    const prompt = `You are a ${framework.name} expert. Identify components used in this component.

Component: ${componentName}
Code:
${content.slice(0, 3000)}

IMPORTANT RULES:
1. Identify components that are ACTUALLY USED in JSX/template sections
2. Look for components in two ways:
   - Components imported via import statements
   - Components used directly in templates (for auto-import like Nuxt.js)
3. INCLUDE both LOCAL PROJECT components AND external library components
4. INCLUDE external library components like:
   - UI framework components (Material-UI, Ant Design, etc.)
   - Third-party library components (ToastContainer, Swiper, etc.)
   - Framework built-ins (NuxtLink, RouterLink, etc.)
   - Vuetify components (v-btn, v-card, v-tab, etc.)
5. Component identification criteria:
   - Starts with uppercase letter (PascalCase)
   - Used as XML-like tags in JSX/template: <ComponentName />
   - NOT CSS classNames (className="someClass" or class="some-class")
6. EXCLUDE regular DOM elements (div, span, img, button, etc.)
7. EXCLUDE composables, utilities, and types
8. Include self-referencing components (recursive components are allowed)

Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "components": [
    {
      "name": "ComponentName",
      "type": "component",
      "filePath": "path/to/component"
    }
  ]
}

CRITICAL: Response must be ONLY the JSON object, nothing else.`;

    try {
      const response = await this.llmClient.chatWithUsage(prompt);
      this.trackTokenUsage(response.usage);
      
      // More robust JSON cleaning and repair
      let cleanResponse = response.content.trim();
      
      // Remove markdown code blocks and any extra text
      cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/\s*```/g, '');
      cleanResponse = cleanResponse.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      
      // Find JSON object
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      // Try to fix common JSON issues
      cleanResponse = cleanResponse
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/'/g, '"'); // Replace single quotes with double quotes
      
      // Fix incomplete JSON by trying to repair truncated properties
      cleanResponse = this.repairIncompleteJson(cleanResponse);
      
      let result;
      try {
        result = JSON.parse(cleanResponse);
      } catch (parseError) {
        this.log(`⚠️ JSON解析エラー: ${parseError}. 原文: ${cleanResponse.slice(0, 200)}...`);
        
        // Try to extract components using regex as fallback
        const fallbackResult = this.extractComponentsWithRegex(response.content);
        if (fallbackResult.length > 0) {
          this.log(`🔧 正規表現フォールバックで${fallbackResult.length}個のコンポーネントを検出`);
          return fallbackResult;
        }
        
        // Ultimate fallback: return empty components array
        return [];
      }
      
      const components: ComponentInfo[] = [];
      
      for (const comp of result.components) {
        const component: ComponentInfo = {
          name: comp.name,
          type: comp.type,
          filePath: comp.filePath || undefined,
          children: []
        };

        // コンポーザブルをフィルタリング（外部コンポーネントは含める）
        if (this.isComposableFunction(comp.name)) {
          this.log(`🚫 コンポーザブルをスキップ: ${comp.name}`);
          continue;
        }

        // 循環参照チェック（3回以上の同じコンポーネントは制限）
        const pathKey = `${comp.name}:${comp.filePath || 'unknown'}`;
        const occurrenceCount = currentPath.filter(path => path.startsWith(`${comp.name}:`)).length;
        
        if (occurrenceCount >= 3) {
          this.log(`🔄 深い循環参照を検出（${occurrenceCount}回目）: ${comp.name} - 制限適用`);
          components.push(component);
          continue;
        }
        
        if (occurrenceCount > 0) {
          this.log(`🔁 再帰コンポーネント（${occurrenceCount + 1}回目）: ${comp.name}`);
        }

        // コンポーネントファイルを探す
        const componentFile = this.findComponentFile(comp.filePath, comp.name, files);
        if (componentFile) {
          try {
            const componentContent = await readFile(componentFile.path, 'utf-8');
            this.log(`🔍 解析中: ${comp.name} (深度${depth}) - ${componentFile.relativePath}`);
            
            // 現在のパスに追加
            const newPath = [...currentPath, pathKey];
            
            // 再帰的にコンポーネントを解析
            component.children = await this.extractComponentsRecursively(
              componentContent,
              comp.name,
              framework,
              files,
              visitedComponents,
              depth + 1,
              maxDepth,
              newPath
            );
          } catch (error) {
            this.log(`⚠️ コンポーネントファイル読み込みに失敗: ${comp.name} - ${error}`);
          }
        } else {
          this.log(`⚠️ コンポーネントファイルが見つかりません: ${comp.name} (推定: ${comp.filePath})`);
        }

        components.push(component);
      }
      
      return components;
    } catch (error) {
      this.log(`⚠️ コンポーネント抽出に失敗: ${error}`);
      return [];
    }
  }

  private findComponentFile(estimatedPath: string | undefined, componentName: string, files: ScannedFile[]): ScannedFile | null {
    // 1. 推定パスで直接探す
    if (estimatedPath) {
      const normalizedPath = estimatedPath.replace(/^\.\//, '').replace(/^\//, '');
      const file = files.find(f => 
        f.relativePath === estimatedPath || 
        f.relativePath === normalizedPath ||
        f.relativePath.endsWith(normalizedPath)
      );
      if (file) {
        this.log(`✅ 推定パスでファイル発見: ${estimatedPath} -> ${file.relativePath}`);
        return file;
      }
    }

    // 2. コンポーネント名での厳密マッチ
    const exactNames = [
      `${componentName}.jsx`,
      `${componentName}.tsx`,
      `${componentName}.js`,
      `${componentName}.ts`,
      `${componentName}.vue`,
    ];

    for (const name of exactNames) {
      const file = files.find(f => f.name === name);
      if (file) {
        this.log(`✅ 厳密名でファイル発見: ${name} -> ${file.relativePath}`);
        return file;
      }
    }

    // 3. 小文字変換での検索
    const lowerNames = [
      `${componentName.toLowerCase()}.jsx`,
      `${componentName.toLowerCase()}.tsx`,
      `${componentName.toLowerCase()}.js`,
      `${componentName.toLowerCase()}.ts`,
      `${componentName.toLowerCase()}.vue`,
    ];

    for (const name of lowerNames) {
      const file = files.find(f => f.name === name);
      if (file) {
        this.log(`✅ 小文字名でファイル発見: ${name} -> ${file.relativePath}`);
        return file;
      }
    }

    // 4. パターンマッチでの柔軟検索
    const flexiblePatterns = [
      new RegExp(`${componentName.toLowerCase()}\\.(jsx?|tsx?|vue)$`, 'i'),
      new RegExp(`${componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '')}\\.(jsx?|tsx?|vue)$`, 'i'),
      new RegExp(`${componentName.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '')}\\.(jsx?|tsx?|vue)$`, 'i'),
    ];

    for (const pattern of flexiblePatterns) {
      const file = files.find(f => pattern.test(f.name));
      if (file) {
        this.log(`✅ パターンマッチでファイル発見: ${pattern} -> ${file.relativePath}`);
        return file;
      }
    }

    // 5. パス含みでの検索
    const pathPatterns = [
      new RegExp(`${componentName.toLowerCase()}`, 'i'),
      new RegExp(`${componentName}`, 'i'),
    ];

    for (const pattern of pathPatterns) {
      const file = files.find(f => pattern.test(f.relativePath));
      if (file) {
        this.log(`✅ パス含みでファイル発見: ${pattern} -> ${file.relativePath}`);
        return file;
      }
    }

    this.log(`❌ ファイルが見つかりません: ${componentName} (推定: ${estimatedPath})`);
    return null;
  }

  private countTotalComponents(components: ComponentInfo[]): number {
    let count = components.length;
    for (const component of components) {
      count += this.countTotalComponents(component.children);
    }
    return count;
  }

  private isComposableFunction(componentName: string): boolean {
    // コンポーザブル関数のパターン（useXxx）
    const composablePatterns = [
      /^use[A-Z]/,  // useXxx
      /^is[A-Z]/,   // isXxx
      /^get[A-Z]/,  // getXxx
      /^set[A-Z]/,  // setXxx
      /^has[A-Z]/,  // hasXxx
      /^can[A-Z]/,  // canXxx
    ];

    return composablePatterns.some(pattern => pattern.test(componentName));
  }

  private isExternalLibraryComponent(componentName: string, filePath?: string): boolean {
    // 外部ライブラリの典型的なパターン
    const externalPatterns = [
      // Vuetify
      /^v-[a-z]/i,
      // Nuxt/Vue built-ins
      /^(NuxtLink|RouterLink|NuxtPage|NuxtLayout)$/i,
      // Common UI libraries
      /^(Swiper|Image)$/i,
      // Package imports
      /^@/,
    ];

    // ファイルパスに外部ライブラリの兆候がある
    const externalPaths = [
      'node_modules',
      'vuetify/lib',
      '@vueuse',
      'nuxt',
      '~/types',
      '~/composables',
    ];

    // コンポーネント名のパターンチェック
    if (externalPatterns.some(pattern => pattern.test(componentName))) {
      return true;
    }

    // ファイルパスのチェック
    if (filePath && externalPaths.some(path => filePath.includes(path))) {
      return true;
    }

    return false;
  }

  private trackTokenUsage(usage: any): void {
    if (usage) {
      this.tokenUsage.totalTokens += usage.totalTokens || 0;
      this.tokenUsage.promptTokens += usage.promptTokens || 0;
      this.tokenUsage.completionTokens += usage.completionTokens || 0;
      this.tokenUsage.llmCalls += 1;
    }
  }

  private log(message: string): void {
    this.analysisLog.push(message);
    console.log(message);
  }

  private repairIncompleteJson(json: string): string {
    // Remove incomplete property at the end
    json = json.replace(/,\s*"[^"]*":\s*"[^"]*\.\.\..*$/g, '');
    json = json.replace(/,\s*"[^"]*":\s*[^,}\]]*$/g, '');
    
    // Ensure proper closing
    if (!json.endsWith('}')) {
      // Find the last complete object and close it
      const lastCompleteObject = json.lastIndexOf('}');
      if (lastCompleteObject !== -1) {
        json = json.substring(0, lastCompleteObject + 1);
      }
    }
    
    // Fix array closing
    const componentArrayStart = json.indexOf('"components":[');
    if (componentArrayStart !== -1) {
      const afterArray = json.substring(componentArrayStart);
      if (!afterArray.includes(']')) {
        json = json.replace(/"components":\[([^\]]+)$/, '"components":[$1]');
      }
    }
    
    return json;
  }

  private extractComponentsWithRegex(content: string): ComponentInfo[] {
    const components: ComponentInfo[] = [];
    
    // Extract component names from the content using regex
    const componentRegex = /"name":\s*"([^"]+)"/g;
    const typeRegex = /"type":\s*"([^"]+)"/g;
    const pathRegex = /"filePath":\s*"([^"]+)"/g;
    
    let match;
    const names: string[] = [];
    const types: string[] = [];
    const paths: string[] = [];
    
    while ((match = componentRegex.exec(content)) !== null) {
      names.push(match[1]);
    }
    
    while ((match = typeRegex.exec(content)) !== null) {
      types.push(match[1]);
    }
    
    while ((match = pathRegex.exec(content)) !== null) {
      paths.push(match[1]);
    }
    
    // Match names with types and paths
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const type = types[i] || 'component';
      const filePath = paths[i] || undefined;
      
      if (name && !this.isComposableFunction(name)) {
        components.push({
          name,
          type: type as 'component' | 'layout' | 'utility' | 'hook',
          filePath,
          children: []
        });
      }
    }
    
    return components;
  }
} 