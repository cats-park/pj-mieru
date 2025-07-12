import path from 'path';
import { readFile, access } from 'fs/promises';
import * as ts from 'typescript';
import { AstAnalysisResult } from '../types/ast.js';
import { ScannedFile } from '../types/scanner.js';

export interface RouteInfo {
  path: string;
  component: string;
  componentFile?: string;
  exact?: boolean;
  children?: RouteInfo[];
}

export interface ReactRouterAnalysisResult {
  appComponent: string;
  routes: RouteInfo[];
  pageComponents: string[];
  componentDependencies: Map<string, string[]>;
  analysisLog: string[];
}

/**
 * React系プロジェクトのルーティング情報を解析するクラス
 */
export class ReactRouterAnalyzer {
  private projectPath: string;
  private analysisLog: string[] = [];
  private scannedFiles: ScannedFile[] = [];

  constructor(projectPath: string, scannedFiles: ScannedFile[] = []) {
    this.projectPath = projectPath;
    this.scannedFiles = scannedFiles;
  }

  /**
   * React Router解析のメイン実行メソッド
   */
  async analyzeRouting(): Promise<ReactRouterAnalysisResult> {
    this.log('🚀 React Router解析を開始...');

    // Step 1: App.js/App.tsx を特定
    const appComponent = await this.findAppComponent();
    if (!appComponent) {
      throw new Error('App component not found');
    }

    this.log(`📱 App component found: ${appComponent}`);

    // Step 2: ルーティング情報を解析
    const routes = await this.extractRoutes(appComponent);
    this.log(`🛣️ ${routes.length}個のルートを検出`);

    // Step 3: 各ルートのコンポーネントファイルを特定
    const pageComponents = await this.resolveRouteComponents(routes);
    this.log(`📄 ${pageComponents.length}個のページコンポーネントを特定`);

    // Step 4: コンポーネントの依存関係を再帰的に解析
    const componentDependencies = await this.analyzeComponentDependencies(pageComponents);
    this.log(`🔗 ${componentDependencies.size}個のコンポーネントの依存関係を解析完了`);

    return {
      appComponent,
      routes,
      pageComponents,
      componentDependencies,
      analysisLog: [...this.analysisLog]
    };
  }

  /**
   * App.js/App.tsx を特定
   */
  private async findAppComponent(): Promise<string | null> {
    const appCandidates = [
      'src/App.tsx',
      'src/App.jsx',
      'src/App.js',
      'src/App.ts',
      'App.tsx',
      'App.jsx',
      'App.js',
      'App.ts',
      'src/index.tsx',
      'src/index.jsx',
      'src/index.js',
      'src/main.tsx',
      'src/main.jsx',
      'src/main.js'
    ];

    for (const candidate of appCandidates) {
      try {
        const filePath = path.join(this.projectPath, candidate);
        await access(filePath);
        
        // ファイルの内容をチェックして、実際にルーティングが含まれているか確認
        const content = await readFile(filePath, 'utf-8');
        if (this.containsRouting(content)) {
          return candidate;
        }
      } catch {
        // ファイルが存在しない場合は次を試す
      }
    }

    // scannedFilesからも検索
    const appFile = this.scannedFiles.find(file => 
      /App\.(tsx?|jsx?)$/.test(path.basename(file.path)) ||
      /index\.(tsx?|jsx?)$/.test(path.basename(file.path)) ||
      /main\.(tsx?|jsx?)$/.test(path.basename(file.path))
    );

    if (appFile) {
      try {
        const content = await readFile(appFile.path, 'utf-8');
        if (this.containsRouting(content)) {
          return appFile.relativePath;
        }
      } catch {
        // ファイル読み込みエラー
      }
    }

    return null;
  }

  /**
   * ファイルにルーティング情報が含まれているかチェック
   */
  private containsRouting(content: string): boolean {
    const routingPatterns = [
      // React Router
      /from ['"`]react-router-dom['"`]/,
      /import.*Router.*from/,
      /<Router/,
      /<BrowserRouter/,
      /<HashRouter/,
      /<Routes/,
      /<Route/,
      /<Switch/,
      
      // Next.js
      /from ['"`]next\/router['"`]/,
      /useRouter/,
      /getServerSideProps/,
      /getStaticProps/,
      
      // Reach Router
      /from ['"`]@reach\/router['"`]/,
      
      // Vue Router (念のため)
      /vue-router/,
      
      // Generic routing patterns
      /route/i,
      /router/i,
      /navigate/i
    ];

    return routingPatterns.some(pattern => pattern.test(content));
  }

  /**
   * ルーティング情報を抽出
   */
  private async extractRoutes(appComponentPath: string): Promise<RouteInfo[]> {
    try {
      const filePath = path.join(this.projectPath, appComponentPath);
      const content = await readFile(filePath, 'utf-8');
      
      // TypeScript Compiler APIでAST解析
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        this.getScriptKind(appComponentPath)
      );

      const routes: RouteInfo[] = [];
      this.visitNodeForRoutes(sourceFile, routes);

      // Next.js のファイルベースルーティングも検出
      if (routes.length === 0) {
        const nextRoutes = await this.extractNextJSRoutes();
        routes.push(...nextRoutes);
      }

      return routes;
    } catch (error) {
      this.log(`⚠️ ルート抽出エラー: ${error}`);
      return [];
    }
  }

  /**
   * ファイル拡張子からScriptKindを決定
   */
  private getScriptKind(filePath: string): ts.ScriptKind {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.ts':
        return ts.ScriptKind.TS;
      case '.tsx':
        return ts.ScriptKind.TSX;
      case '.jsx':
        return ts.ScriptKind.JSX;
      case '.js':
      default:
        return ts.ScriptKind.JS;
    }
  }

  /**
   * ASTノードを訪問してRoute要素を検索
   */
  private visitNodeForRoutes(node: ts.Node, routes: RouteInfo[]): void {
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const elementName = this.getJSXElementName(node);
      if (elementName === 'Route') {
        const route = this.extractRouteInfo(node);
        if (route) {
          routes.push(route);
        }
      }
    }

    ts.forEachChild(node, (child) => this.visitNodeForRoutes(child, routes));
  }

  /**
   * Next.js のファイルベースルーティングを検出
   */
  private async extractNextJSRoutes(): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    
    // pages/ ディレクトリをチェック
    const pageFiles = this.scannedFiles.filter(file =>
      file.path.includes('/pages/') || file.path.includes('/app/')
    );

    for (const file of pageFiles) {
      const route = this.convertFilePathToRoute(file.relativePath);
      if (route) {
        routes.push({
          path: route,
          component: path.basename(file.relativePath, path.extname(file.relativePath)),
          componentFile: file.relativePath
        });
      }
    }

    return routes;
  }

  /**
   * ファイルパスをNext.jsルートに変換
   */
  private convertFilePathToRoute(filePath: string): string | null {
    let route = filePath;

    // pages/ または app/ を除去
    route = route.replace(/^(pages|app)\//, '');
    
    // 拡張子を除去
    route = route.replace(/\.(tsx?|jsx?)$/, '');
    
    // index を除去
    route = route.replace(/\/index$/, '');
    
    // 動的ルートを変換
    route = route.replace(/\[([^\]]+)\]/g, ':$1');
    
    // スラッシュで始まる
    if (!route.startsWith('/')) {
      route = '/' + route;
    }

    // ルートパスの場合
    if (route === '/') {
      return route;
    }

    return route || null;
  }

  /**
   * JSX要素名を取得
   */
  private getJSXElementName(node: ts.JsxElement | ts.JsxSelfClosingElement): string | null {
    const openingElement = ts.isJsxElement(node) ? node.openingElement : node;
    const tagName = openingElement.tagName;
    
    if (ts.isIdentifier(tagName)) {
      return tagName.text;
    } else if (ts.isPropertyAccessExpression(tagName)) {
      return tagName.name.text;
    }
    
    return null;
  }

  /**
   * Route要素からルート情報を抽出
   */
  private extractRouteInfo(node: ts.JsxElement | ts.JsxSelfClosingElement): RouteInfo | null {
    const openingElement = ts.isJsxElement(node) ? node.openingElement : node;
    const attributes = openingElement.attributes.properties;
    
    let routePath = '';
    let component = '';
    let exact = false;

    for (const attr of attributes) {
      if (ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name)) {
        const attrName = attr.name.text;
        
        if (attrName === 'path' && attr.initializer && ts.isStringLiteral(attr.initializer)) {
          routePath = attr.initializer.text;
        } else if (attrName === 'component' && attr.initializer && ts.isJsxExpression(attr.initializer)) {
          if (attr.initializer.expression && ts.isIdentifier(attr.initializer.expression)) {
            component = attr.initializer.expression.text;
          }
        } else if (attrName === 'exact') {
          exact = true;
        } else if (attrName === 'element' && attr.initializer && ts.isJsxExpression(attr.initializer)) {
          // React Router v6 の element prop
          component = this.extractComponentFromElement(attr.initializer.expression);
        }
      }
    }

    if (routePath && component) {
      return { path: routePath, component, exact };
    }

    return null;
  }

  /**
   * element prop からコンポーネント名を抽出
   */
  private extractComponentFromElement(expression: ts.Expression | undefined): string {
    if (expression && ts.isJsxElement(expression)) {
      return this.getJSXElementName(expression) || '';
    } else if (expression && ts.isIdentifier(expression)) {
      return expression.text;
    }
    return '';
  }

  /**
   * ルートコンポーネントのファイルパスを解決
   */
  private async resolveRouteComponents(routes: RouteInfo[]): Promise<string[]> {
    const pageComponents: string[] = [];

    for (const route of routes) {
      if (route.componentFile) {
        pageComponents.push(route.componentFile);
        continue;
      }

      // コンポーネント名からファイルを検索
      const componentFile = await this.findComponentFile(route.component);
      if (componentFile) {
        route.componentFile = componentFile;
        pageComponents.push(componentFile);
      }
    }

    return pageComponents;
  }

  /**
   * コンポーネント名からファイルを検索
   */
  private async findComponentFile(componentName: string): Promise<string | null> {
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    const directories = ['src/pages', 'src/components', 'src/views', 'pages', 'components', 'views', 'src'];

    // 直接的なファイル名検索
    for (const dir of directories) {
      for (const ext of extensions) {
        const candidate = path.join(dir, componentName + ext);
        try {
          const filePath = path.join(this.projectPath, candidate);
          await access(filePath);
          return candidate;
        } catch {
          // ファイルが存在しない
        }
      }
    }

    // scannedFiles から検索
    const matchingFile = this.scannedFiles.find(file => {
      const baseName = path.basename(file.relativePath, path.extname(file.relativePath));
      return baseName === componentName;
    });

    return matchingFile?.relativePath || null;
  }

  /**
   * コンポーネントの依存関係を再帰的に解析
   */
  private async analyzeComponentDependencies(pageComponents: string[]): Promise<Map<string, string[]>> {
    const dependencies = new Map<string, string[]>();
    const analyzed = new Set<string>();

    for (const component of pageComponents) {
      await this.analyzeComponentDependenciesRecursive(component, dependencies, analyzed, 0, 5);
    }

    return dependencies;
  }

  /**
   * コンポーネントの依存関係を再帰的に解析（内部メソッド）
   */
  private async analyzeComponentDependenciesRecursive(
    componentPath: string,
    dependencies: Map<string, string[]>,
    analyzed: Set<string>,
    depth: number,
    maxDepth: number
  ): Promise<void> {
    if (depth >= maxDepth || analyzed.has(componentPath)) {
      return;
    }

    analyzed.add(componentPath);
    this.log(`📦 コンポーネント解析中 (depth ${depth}): ${componentPath}`);

    try {
      const filePath = path.join(this.projectPath, componentPath);
      const content = await readFile(filePath, 'utf-8');
      const componentDeps = await this.extractComponentDependencies(content, componentPath);
      
      dependencies.set(componentPath, componentDeps);

      // 子コンポーネントも再帰的に解析
      for (const dep of componentDeps) {
        await this.analyzeComponentDependenciesRecursive(dep, dependencies, analyzed, depth + 1, maxDepth);
      }
    } catch (error) {
      this.log(`⚠️ コンポーネント解析エラー (${componentPath}): ${error}`);
    }
  }

  /**
   * ファイルからコンポーネントの依存関係を抽出
   */
  private async extractComponentDependencies(content: string, currentFile: string): Promise<string[]> {
    const dependencies: string[] = [];

    try {
      // TypeScript Compiler APIでAST解析
      const sourceFile = ts.createSourceFile(
        currentFile,
        content,
        ts.ScriptTarget.Latest,
        true,
        this.getScriptKind(currentFile)
      );

      const importedComponents = new Set<string>();
      this.visitNodeForDependencies(sourceFile, importedComponents, currentFile);

      // 使用されているコンポーネントのみを依存関係に追加
      for (const imported of importedComponents) {
        dependencies.push(imported);
      }

    } catch (error) {
      this.log(`⚠️ AST解析エラー: ${error}`);
    }

    return dependencies;
  }

  /**
   * ASTノードを訪問して依存関係を抽出
   */
  private visitNodeForDependencies(node: ts.Node, importedComponents: Set<string>, currentFile: string): void {
    // Import文の処理
    if (ts.isImportDeclaration(node)) {
      const importPath = (node.moduleSpecifier as ts.StringLiteral).text;
      if (this.isComponentImport(importPath)) {
        const resolvedPath = this.resolveImportPath(importPath, currentFile);
        if (resolvedPath) {
          importedComponents.add(resolvedPath);
        }
      }
    }

    // JSX要素の処理
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const elementName = this.getJSXElementName(node);
      if (elementName && this.isCustomComponent(elementName)) {
        // カスタムコンポーネントが使用されていることを記録
        // (実際のimportとの照合は別途実装可能)
      }
    }

    ts.forEachChild(node, (child) => this.visitNodeForDependencies(child, importedComponents, currentFile));
  }

  /**
   * インポートパスがコンポーネントかどうか判定
   */
  private isComponentImport(importPath: string): boolean {
    // 相対パスのコンポーネントファイル
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return /\.(tsx?|jsx?)$/.test(importPath) || 
             /[A-Z]/.test(path.basename(importPath));
    }
    
    // 絶対パスのコンポーネントファイル
    if (importPath.startsWith('/') || importPath.includes('components') || importPath.includes('pages')) {
      return true;
    }

    return false;
  }

  /**
   * インポートパスを実際のファイルパスに解決
   */
  private resolveImportPath(importPath: string, currentFile: string): string | null {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const currentDir = path.dirname(currentFile);
      let resolvedPath = path.resolve(currentDir, importPath);
      
      // プロジェクトルートからの相対パスに変換
      resolvedPath = path.relative(this.projectPath, resolvedPath);
      
      // 拡張子がない場合は推測
      if (!path.extname(resolvedPath)) {
        const extensions = ['.tsx', '.ts', '.jsx', '.js'];
        for (const ext of extensions) {
          const candidate = resolvedPath + ext;
          const matchingFile = this.scannedFiles.find(file => file.relativePath === candidate);
          if (matchingFile) {
            return candidate;
          }
        }
      }
      
      return resolvedPath;
    }

    return null;
  }

  /**
   * カスタムコンポーネントかどうか判定
   */
  private isCustomComponent(elementName: string): boolean {
    // 大文字で始まる（React/Vue/Angular慣例）
    if (!/^[A-Z]/.test(elementName)) {
      return false;
    }

    // HTMLタグではない
    const htmlTags = ['div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'button', 'input', 'form', 'table', 'tr', 'td', 'th', 'ul', 'ol', 'li'];
    return !htmlTags.includes(elementName.toLowerCase());
  }

  /**
   * ログ出力
   */
  private log(message: string): void {
    this.analysisLog.push(`${new Date().toISOString()}: ${message}`);
    console.log(message);
  }

  /**
   * 解析ログを取得
   */
  getAnalysisLog(): string[] {
    return [...this.analysisLog];
  }
} 