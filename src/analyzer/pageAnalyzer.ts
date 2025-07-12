import {
  PageInfo,
  PageComponent,
  PageLink,
  PageStructure,
  PageConnection,
} from '../types/page.js';
import { ScannedFile } from '../types/scanner.js';
import { AstAnalysisResult, ImportInfo, ComponentUsage } from '../types/ast.js';
import { VueSfcAnalysisResult } from '../types/vue.js';
import { ReactRouterAnalyzer, ReactRouterAnalysisResult } from './reactRouterAnalyzer.js';
import path from 'path';
import fs from 'fs';

export class PageAnalyzer {
  private projectPath: string;
  
  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  private pagePatterns = [
    // Traditional patterns
    /\/pages\//,
    /\/views\//,
    /\/routes\//,
    /\/screens\//,
    
    // Next.js patterns
    /\/app\//,
    /page\.(vue|jsx?|tsx?)$/,
    /layout\.(vue|jsx?|tsx?)$/,
    /loading\.(vue|jsx?|tsx?)$/,
    /error\.(vue|jsx?|tsx?)$/,
    /not-found\.(vue|jsx?|tsx?)$/,
    
    // Common entry points
    /index\.(vue|jsx?|tsx?)$/,
    /main\.(vue|jsx?|tsx?)$/,
    /App\.(vue|jsx?|tsx?)$/,
    
    // React patterns
    /\/src\/App\./,
    /\/src\/index\./,
    /\/src\/main\./,
    /\/src\/pages\//,
    /\/src\/views\//,
    /\/src\/components\/pages\//,
    /\/src\/components\/views\//,
    
    // Vue patterns
    /\/src\/views\//,
    /\/src\/pages\//,
    /\/src\/App\./,
    /\/src\/main\./,
    
    // Nuxt.js patterns
    /\/layouts\//,
    /\/middleware\//,
    /\/plugins\//,
    
    // Common component directory patterns that might contain pages
    /\/containers\//,
    /\/templates\//,
    /\/features\//,
    /\/modules\//,
    
    // Amazon clone tutorial specific patterns
    /\/public\//,
    /\/build\//,
    /\/dist\//,
    
    // Generic patterns for any directory structure
    /Home\.(vue|jsx?|tsx?)$/,
    /Product\.(vue|jsx?|tsx?)$/,
    /Cart\.(vue|jsx?|tsx?)$/,
    /Login\.(vue|jsx?|tsx?)$/,
    /Register\.(vue|jsx?|tsx?)$/,
    /Profile\.(vue|jsx?|tsx?)$/,
    /Dashboard\.(vue|jsx?|tsx?)$/,
    /Settings\.(vue|jsx?|tsx?)$/,
    /Checkout\.(vue|jsx?|tsx?)$/,
    /Search\.(vue|jsx?|tsx?)$/,
    /About\.(vue|jsx?|tsx?)$/,
    /Contact\.(vue|jsx?|tsx?)$/,
    /Admin\.(vue|jsx?|tsx?)$/,
    /Landing\.(vue|jsx?|tsx?)$/,
    /Welcome\.(vue|jsx?|tsx?)$/,
    /NotFound\.(vue|jsx?|tsx?)$/,
    /Error\.(vue|jsx?|tsx?)$/,
    /Loading\.(vue|jsx?|tsx?)$/,
    
    // Common page name patterns with capitalization
    /[A-Z][a-z]+Page\.(vue|jsx?|tsx?)$/,
    /[A-Z][a-z]+View\.(vue|jsx?|tsx?)$/,
    /[A-Z][a-z]+Screen\.(vue|jsx?|tsx?)$/,
    /[A-Z][a-z]+Container\.(vue|jsx?|tsx?)$/,
    
    // CamelCase patterns
    /[A-Z][a-zA-Z]*\.(vue|jsx?|tsx?)$/,
  ];

  private linkPatterns = [
    // Nuxt.js specific components
    /<NuxtLink[^>]+to=["']([^"']+)["']/gi,
    /<nuxt-link[^>]+to=["']([^"']+)["']/gi,
    // Vue Router
    /<router-link[^>]+to=["']([^"']+)["']/gi,
    // React Router
    /<Link[^>]+to=["']([^"']+)["']/gi,
    /<NavLink[^>]+to=["']([^"']+)["']/gi,
    // HTML links
    /<a[^>]+href=["']([^"']+)["']/gi,
    // Dynamic href with baseUrl
    /:href="\$baseUrl\(['"`]([^'"`]+)['"`]\)"/gi,
    /href="\$baseUrl\(['"`]([^'"`]+)['"`]\)"/gi,
    // JavaScript router calls
    /router\.push\(['"`]([^'"`]+)['"`]\)/gi,
    /\$router\.push\(['"`]([^'"`]+)['"`]\)/gi,
    /this\.\$router\.push\(['"`]([^'"`]+)['"`]\)/gi,
    // Nuxt navigation
    /navigateTo\(['"`]([^'"`]+)['"`]\)/gi,
    /await\s+navigateTo\(['"`]([^'"`]+)['"`]\)/gi,
    /navigate\(['"`]([^'"`]+)['"`]\)/gi,
    // Vue 3 Composition API
    /useRouter\(\)\.push\(['"`]([^'"`]+)['"`]\)/gi,
    // Object routes in templates
    /:to="\{[^}]*path:\s*['"`]([^'"`]+)['"`]/gi,
    /:to="[^"]*['"`]([^'"`]+)['"`]/gi,
    // Dynamic route binding
    /:to="`([^`]*\/[^`]*)`"/gi,
    /:href="`([^`]*\/[^`]*)`"/gi,
    // Route names and paths
    /name:\s*['"`]([^'"`]+)['"`]/gi,
    /path:\s*['"`]([^'"`]+)['"`]/gi,
  ];

  async analyzePages(
    files: ScannedFile[],
    astResults: AstAnalysisResult[],
    vueResults: VueSfcAnalysisResult[]
  ): Promise<PageStructure> {
    const startTime = Date.now();

    // プロジェクトタイプを判定
    const projectType = this.detectProjectType(files);
    
    if (projectType === 'react' || projectType === 'next') {
      // React系プロジェクトの場合は新しいアプローチを使用
      return await this.analyzeReactPages(files, astResults, startTime);
    } else {
      // Vue系プロジェクトの場合は従来のアプローチを使用
      return await this.analyzeVuePages(files, astResults, vueResults, startTime);
    }
  }

  /**
   * プロジェクトタイプを検出
   */
  private detectProjectType(files: ScannedFile[]): 'react' | 'vue' | 'next' | 'nuxt' | 'unknown' {
    const fileExtensions = files.map(f => path.extname(f.path).toLowerCase());
    const hasVue = fileExtensions.some(ext => ext === '.vue');
    const hasJsx = fileExtensions.some(ext => ext === '.jsx' || ext === '.tsx');
    
    // ディレクトリ構造からも判定
    const hasNextjsStructure = files.some(f => 
      f.path.includes('/pages/') || 
      f.path.includes('/app/') || 
      f.path.includes('next.config')
    );
    
    const hasNuxtStructure = files.some(f => 
      f.path.includes('nuxt.config') || 
      f.path.includes('.nuxt/')
    );

    if (hasNextjsStructure) return 'next';
    if (hasNuxtStructure) return 'nuxt';
    if (hasVue) return 'vue';
    if (hasJsx) return 'react';
    
    return 'unknown';
  }

  /**
   * React系プロジェクトの解析
   */
  private async analyzeReactPages(
    files: ScannedFile[],
    astResults: AstAnalysisResult[],
    startTime: number
  ): Promise<PageStructure> {
    console.log('🚀 React系プロジェクトを検出しました。ルーティング解析を開始...');

         try {
       // ReactRouterAnalyzerを使用してルーティング情報を解析
       const reactAnalyzer = new ReactRouterAnalyzer(this.projectPath, files);
       const routerResult = await reactAnalyzer.analyzeRouting();

      console.log(`📄 ${routerResult.pageComponents.length}個のページコンポーネントを検出`);
      console.log(`🔗 ${routerResult.componentDependencies.size}個のコンポーネント依存関係を解析`);

      // ルーティング結果からPageStructureを構築
      return this.buildPageStructureFromRouting(routerResult, files, astResults, startTime);
    } catch (error) {
      console.warn(`⚠️ React Router解析に失敗しました。従来の方法にフォールバック: ${error}`);
      // フォールバックとして従来の方法を使用
      return await this.analyzeVuePages(files, astResults, [], startTime);
    }
  }

  /**
   * ルーティング解析結果からPageStructureを構築
   */
  private buildPageStructureFromRouting(
    routerResult: ReactRouterAnalysisResult,
    files: ScannedFile[],
    astResults: AstAnalysisResult[],
    startTime: number
  ): PageStructure {
    const pages = new Map<string, PageInfo>();

    // 各ルートからPageInfoを構築
    for (const route of routerResult.routes) {
      if (!route.componentFile) continue;

      const file = files.find(f => f.relativePath === route.componentFile);
      if (!file) continue;

      const astResult = astResults.find(r => r.filePath === file.path);
      
      // ページコンポーネントの依存関係を取得
      const dependencies = routerResult.componentDependencies.get(route.componentFile) || [];
      const components = this.buildComponentsFromDependencies(dependencies, files);

      const pageInfo: PageInfo = {
        filePath: file.path,
        name: route.component,
        route: route.path,
        type: 'page',
        components,
        links: [], // 後で実装可能
        size: file.size,
        lastModified: new Date(file.lastModified),
      };

      pages.set(file.path, pageInfo);
    }

    const endTime = Date.now();

    // 統計情報を計算
    const stats = {
      totalPages: pages.size,
      totalComponents: Array.from(pages.values()).reduce(
        (sum, page) => sum + page.components.length,
        0
      ),
      totalLinks: 0, // 後で実装可能
      isolatedPages: pages.size, // 暫定値
      analysisTime: endTime - startTime,
    };

    return {
      pages,
      pageLinks: [], // 後で実装可能
      stats,
    };
  }

  /**
   * 依存関係リストからPageComponentを構築
   */
  private buildComponentsFromDependencies(
    dependencies: string[],
    files: ScannedFile[]
  ): PageComponent[] {
    const components: PageComponent[] = [];

    for (const dep of dependencies) {
      const file = files.find(f => f.relativePath === dep);
      if (!file) continue;

      const componentName = path.basename(dep, path.extname(dep));
      
      components.push({
        name: componentName,
        importPath: dep,
        usageLines: [1], // 暫定値
        type: this.getComponentType(dep),
      });
    }

    return components;
  }

  /**
   * Vue系プロジェクトの解析（従来の方法）
   */
  private async analyzeVuePages(
    files: ScannedFile[],
    astResults: AstAnalysisResult[],
    vueResults: VueSfcAnalysisResult[],
    startTime: number
  ): Promise<PageStructure> {
    // Identify page files
    const pageFiles = this.identifyPageFiles(files);
    const pages = new Map<string, PageInfo>();

    // Analyze each page
    for (const file of pageFiles) {
      const pageInfo = await this.analyzePage(file, astResults, vueResults);
      pages.set(file.path, pageInfo);
    }

    // Recursively expand component dependencies
    await this.expandComponentDependencies(
      pages,
      files,
      astResults,
      vueResults
    );

    // Analyze page connections
    const pageLinks = this.analyzePageConnections(pages);

    const endTime = Date.now();

    // Calculate statistics
    const stats = {
      totalPages: pages.size,
      totalComponents: Array.from(pages.values()).reduce(
        (sum, page) => sum + page.components.length,
        0
      ),
      totalLinks: pageLinks.reduce((sum, link) => sum + link.weight, 0),
      isolatedPages: this.countIsolatedPages(pages, pageLinks),
      analysisTime: endTime - startTime,
    };

    return {
      pages,
      pageLinks,
      stats,
    };
  }

  private identifyPageFiles(files: ScannedFile[]): ScannedFile[] {
    return files.filter((file) => {
      // Check against page patterns
      return (
        this.pagePatterns.some((pattern) => pattern.test(file.path)) ||
        this.pagePatterns.some((pattern) => pattern.test(file.relativePath))
      );
    });
  }

  private async analyzePage(
    file: ScannedFile,
    astResults: AstAnalysisResult[],
    vueResults: VueSfcAnalysisResult[]
  ): Promise<PageInfo> {
    // Find corresponding analysis result
    const astResult = astResults.find((r) => r.filePath === file.path);
    const vueResult = vueResults.find((r) => r.filePath === file.path);

    // Extract components used in this page
    const components = this.extractPageComponents(
      astResult,
      vueResult,
      file.path
    );

    // Extract page links
    const links = await this.extractPageLinks(file.path);

    // Generate route from file path
    const route = this.generateRoute(file.relativePath);

    return {
      filePath: file.path,
      name: this.generatePageName(file.relativePath),
      route,
      type: this.determinePageType(file.relativePath),
      components,
      links,
      size: file.size,
      lastModified: new Date(file.lastModified),
    };
  }

  private extractPageComponents(
    astResult?: AstAnalysisResult,
    vueResult?: VueSfcAnalysisResult,
    filePath?: string
  ): PageComponent[] {
    const components: PageComponent[] = [];

    // Extract from Vue SFC result
    if (vueResult && vueResult.success) {
      vueResult.imports.forEach((imp) => {
        if (this.isComponentImport(imp.source)) {
          components.push({
            name:
              imp.name || path.basename(imp.source, path.extname(imp.source)),
            importPath: imp.source,
            usageLines: [imp.line],
            type: this.getComponentType(imp.source),
          });
        }
      });

      // Add component usages
      vueResult.componentUsages.forEach((usage) => {
        const existing = components.find((c) => c.name === usage.name);
        if (existing) {
          existing.usageLines.push(usage.line);
        } else {
          components.push({
            name: usage.name,
            importPath: '',
            usageLines: [usage.line],
            type: 'component',
          });
        }
      });
    }

    // Extract from AST result
    if (astResult) {
      astResult.imports.forEach((imp) => {
        if (this.isComponentImport(imp.source)) {
          components.push({
            name:
              imp.name || path.basename(imp.source, path.extname(imp.source)),
            importPath: imp.source,
            usageLines: [imp.line],
            type: this.getComponentType(imp.source),
          });
        }
      });
    }

    // Additional template parsing for Vue files
    if (filePath && filePath.endsWith('.vue')) {
      const templateComponents = this.extractTemplateComponents(filePath);
      templateComponents.forEach((comp) => {
        const existing = components.find((c) => c.name === comp.name);
        if (existing) {
          existing.usageLines.push(...comp.usageLines);
        } else {
          components.push(comp);
        }
      });
    }

    // Remove duplicates
    return this.deduplicateComponents(components);
  }

  private extractTemplateComponents(filePath: string): PageComponent[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const components: PageComponent[] = [];

      // Extract template section
      const templateMatch = content.match(
        /<template[^>]*>([\s\S]*?)<\/template>/
      );
      if (!templateMatch) return components;

      const templateContent = templateMatch[1];

      // Component usage patterns
      const componentPatterns = [
        // Standard Vue components
        /<([A-Z][a-zA-Z0-9]*)\b[^>]*>/gi,
        // Kebab-case components
        /<([a-z]+-[a-z-]+)\b[^>]*>/gi,
        // Self-closing components
        /<([A-Z][a-zA-Z0-9]*)\b[^>]*\/>/gi,
        /<([a-z]+-[a-z-]+)\b[^>]*\/>/gi,
      ];

      componentPatterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(templateContent)) !== null) {
          const componentName = match[1];

          // Skip HTML elements and Vue directives
          if (this.isValidComponentName(componentName)) {
            const lineNumber = this.getLineNumber(templateContent, match.index);

            const existing = components.find((c) => c.name === componentName);
            if (existing) {
              existing.usageLines.push(lineNumber);
            } else {
              components.push({
                name: componentName,
                importPath: '', // Will be resolved later
                usageLines: [lineNumber],
                type: 'component',
              });
            }
          }
        }
      });

      return components;
    } catch (error) {
      console.warn(
        `Failed to extract template components from ${filePath}:`,
        error
      );
      return [];
    }
  }

  private isValidComponentName(name: string): boolean {
    // Skip HTML elements
    const htmlElements = [
      'div',
      'span',
      'p',
      'a',
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'table',
      'tr',
      'td',
      'th',
      'thead',
      'tbody',
      'section',
      'article',
      'header',
      'footer',
      'nav',
      'main',
      'aside',
      'button',
      'input',
      'form',
      'label',
      'select',
      'option',
      'textarea',
    ];

    // Skip Vue directives and slots
    const vueElements = [
      'template',
      'slot',
      'transition',
      'keep-alive',
      'component',
    ];

    const lowerName = name.toLowerCase();
    return (
      !htmlElements.includes(lowerName) &&
      !vueElements.includes(lowerName) &&
      !lowerName.startsWith('v-') &&
      (name[0] === name[0].toUpperCase() || name.includes('-'))
    );
  }

  private async extractPageLinks(filePath: string): Promise<PageLink[]> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const links: PageLink[] = [];

      this.linkPatterns.forEach((pattern) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const target = match[1];
          if (
            target &&
            !target.startsWith('http') &&
            !target.startsWith('mailto:') &&
            !target.startsWith('tel:')
          ) {
            links.push({
              target,
              type: this.determineLinkType(pattern.source),
              text: this.extractLinkText(content, match.index),
              line: this.getLineNumber(content, match.index),
            });
          }
        }
      });

      return links;
    } catch (error) {
      return [];
    }
  }

  private analyzePageConnections(
    pages: Map<string, PageInfo>
  ): PageConnection[] {
    const connections: PageConnection[] = [];
    const connectionMap = new Map<string, PageConnection>();

    pages.forEach((page) => {
      page.links.forEach((link) => {
        // Find target page
        const targetPage = this.findPageByRoute(pages, link.target);
        if (targetPage) {
          const connectionKey = `${page.filePath}->${targetPage.filePath}`;

          if (connectionMap.has(connectionKey)) {
            connectionMap.get(connectionKey)!.weight++;
          } else {
            connectionMap.set(connectionKey, {
              from: page.filePath,
              to: targetPage.filePath,
              type: this.mapLinkTypeToConnectionType(link.type),
              weight: 1,
            });
          }
        }
      });
    });

    return Array.from(connectionMap.values());
  }

  private isComponentImport(source: string): boolean {
    // Check if import path looks like a component
    const lowerSource = source.toLowerCase();
    const baseName = path.basename(source, path.extname(source));
    
    // Explicit component patterns
    if (
      lowerSource.includes('component') ||
      lowerSource.includes('Component') ||
      /\.(vue|jsx|tsx)$/.test(source)
    ) {
      return true;
    }
    
    // Capital letter start (React/Vue component convention)
    if (/^[A-Z]/.test(baseName)) {
      return true;
    }
    
    // Common component directory patterns
    const componentDirs = [
      'components', 'comp', 'ui', 'shared', 'common', 'widgets',
      'elements', 'parts', 'modules', 'features', 'containers',
      'templates', 'layouts', 'forms', 'modals', 'dialogs',
      'buttons', 'cards', 'headers', 'footers', 'navs', 'menus',
      'sidebar', 'tables', 'lists', 'items', 'icons', 'images'
    ];
    
    if (componentDirs.some(dir => lowerSource.includes(`/${dir}/`) || lowerSource.includes(`\\${dir}\\`))) {
      return true;
    }
    
    // Common component naming patterns
    const componentNames = [
      'header', 'footer', 'nav', 'menu', 'sidebar', 'modal', 'dialog',
      'button', 'card', 'form', 'input', 'select', 'textarea', 'checkbox',
      'radio', 'switch', 'slider', 'table', 'list', 'item', 'icon',
      'image', 'video', 'audio', 'chart', 'graph', 'map', 'calendar',
      'date', 'time', 'picker', 'dropdown', 'tooltip', 'popover',
      'alert', 'toast', 'notification', 'badge', 'chip', 'tag',
      'avatar', 'progress', 'spinner', 'loader', 'skeleton',
      'layout', 'grid', 'row', 'col', 'container', 'wrapper',
      'section', 'panel', 'tabs', 'tab', 'accordion', 'collapse',
      'carousel', 'slider', 'gallery', 'lightbox', 'preview',
      'search', 'filter', 'sort', 'pagination', 'breadcrumb',
      'stepper', 'wizard', 'step', 'editor', 'viewer', 'player'
    ];
    
    if (componentNames.some(name => lowerSource.includes(name))) {
      return true;
    }
    
    // Amazon clone tutorial specific patterns
    const ecommerceComponentNames = [
      'product', 'cart', 'checkout', 'payment', 'order', 'shop',
      'store', 'catalog', 'category', 'filter', 'search', 'review',
      'rating', 'wishlist', 'compare', 'banner', 'slider', 'promo',
      'deal', 'offer', 'price', 'shipping', 'delivery', 'track',
      'user', 'account', 'profile', 'auth', 'login', 'register',
      'forgot', 'reset', 'verify', 'dashboard', 'admin', 'seller'
    ];
    
    if (ecommerceComponentNames.some(name => lowerSource.includes(name))) {
      return true;
    }
    
    // Exclude common non-component patterns
    const nonComponentPatterns = [
      'node_modules', 'dist', 'build', 'public', 'static',
      'assets', 'images', 'img', 'css', 'scss', 'sass', 'less',
      'json', 'config', 'test', 'spec', 'mock', 'fixture',
      'util', 'helper', 'service', 'api', 'store', 'reducer',
      'action', 'mutation', 'middleware', 'plugin', 'mixin',
      'directive', 'constant', 'enum', 'type', 'interface',
      'model', 'schema', 'validation', 'rule', 'guard'
    ];
    
    if (nonComponentPatterns.some(pattern => lowerSource.includes(pattern))) {
      return false;
    }
    
    return false;
  }

  private getComponentType(
    importPath: string
  ): 'vue' | 'react' | 'component' | 'layout' {
    const lowerPath = importPath.toLowerCase();
    
    // File extension based detection
    if (importPath.endsWith('.vue')) return 'vue';
    if (importPath.endsWith('.jsx') || importPath.endsWith('.tsx')) return 'react';
    
    // Layout detection
    if (lowerPath.includes('layout') || lowerPath.includes('Layout') ||
        lowerPath.includes('template') || lowerPath.includes('Template')) {
      return 'layout';
    }
    
    // Default to component
    return 'component';
  }

  private generateRoute(relativePath: string): string {
    // Convert file path to route
    let route = relativePath
      .replace(/^(pages|views|routes)\//, '/')
      .replace(/\.(vue|jsx?|tsx?)$/, '')
      .replace(/\/index$/, '')
      .replace(/\[([^\]]+)\]/g, ':$1'); // Dynamic routes

    return route || '/';
  }

  private generatePageName(relativePath: string): string {
    const baseName = path.basename(relativePath, path.extname(relativePath));
    return baseName === 'index'
      ? path.basename(path.dirname(relativePath)) || 'Home'
      : baseName;
  }

  private determinePageType(
    relativePath: string
  ): 'page' | 'layout' | 'component' {
    if (relativePath.includes('layout') || relativePath.includes('Layout')) {
      return 'layout';
    }
    if (relativePath.includes('page') || relativePath.includes('view')) {
      return 'page';
    }
    return 'component';
  }

  private determineLinkType(
    patternSource: string
  ): 'router-link' | 'href' | 'navigation' | 'dynamic' {
    if (
      patternSource.includes('router-link') ||
      patternSource.includes('nuxt-link')
    ) {
      return 'router-link';
    }
    if (patternSource.includes('href')) {
      return 'href';
    }
    if (patternSource.includes('push') || patternSource.includes('navigate')) {
      return 'dynamic';
    }
    return 'navigation';
  }

  private mapLinkTypeToConnectionType(
    linkType: string
  ): 'navigation' | 'route' | 'link' {
    switch (linkType) {
      case 'router-link':
      case 'dynamic':
        return 'route';
      case 'href':
        return 'link';
      default:
        return 'navigation';
    }
  }

  private deduplicateComponents(components: PageComponent[]): PageComponent[] {
    const map = new Map<string, PageComponent>();

    components.forEach((comp) => {
      const key = `${comp.name}-${comp.importPath}`;
      if (map.has(key)) {
        const existing = map.get(key)!;
        existing.usageLines.push(...comp.usageLines);
      } else {
        map.set(key, { ...comp, usageLines: [...comp.usageLines] });
      }
    });

    return Array.from(map.values());
  }

  private findPageByRoute(
    pages: Map<string, PageInfo>,
    route: string
  ): PageInfo | undefined {
    // Clean up the route for matching
    const cleanRoute = route.replace(/^#/, '').replace(/\/$/, '') || '/';

    // First try exact match
    const exactMatch = Array.from(pages.values()).find(
      (page) => page.route === cleanRoute
    );
    if (exactMatch) return exactMatch;

    // Try matching with trailing slash
    const withSlash = Array.from(pages.values()).find(
      (page) =>
        page.route === `${cleanRoute}/` || `${page.route}/` === cleanRoute
    );
    if (withSlash) return withSlash;

    // Try partial match for dynamic routes
    const partialMatch = Array.from(pages.values()).find((page) => {
      const pageRoute = page.route.replace(/:\w+/g, '[^/]+'); // Convert :param to regex
      const regex = new RegExp(`^${pageRoute}/?$`);
      return regex.test(cleanRoute);
    });
    if (partialMatch) return partialMatch;

    // Try to match by file name/path
    const pathMatch = Array.from(pages.values()).find((page) => {
      const pageName = page.name.toLowerCase();
      const routeParts = cleanRoute.split('/').filter(Boolean);
      return routeParts.some((part) => part === pageName);
    });

    return pathMatch;
  }

  private countIsolatedPages(
    pages: Map<string, PageInfo>,
    connections: PageConnection[]
  ): number {
    const connectedPages = new Set<string>();
    connections.forEach((conn) => {
      connectedPages.add(conn.from);
      connectedPages.add(conn.to);
    });

    return pages.size - connectedPages.size;
  }

  private extractLinkText(content: string, index: number): string {
    // Simple extraction of link text - can be improved
    const beforeIndex = Math.max(0, index - 50);
    const afterIndex = Math.min(content.length, index + 100);
    const snippet = content.slice(beforeIndex, afterIndex);
    const match = snippet.match(/>([^<]+)</);
    return match ? match[1].trim() : '';
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  /**
   * Recursively expand component dependencies
   */
  private async expandComponentDependencies(
    pages: Map<string, PageInfo>,
    files: ScannedFile[],
    astResults: AstAnalysisResult[],
    vueResults: VueSfcAnalysisResult[]
  ): Promise<void> {
    const processedComponents = new Set<string>();

    for (const [pageId, page] of pages) {
      const expandedComponents = await this.getComponentDependenciesRecursively(
        page.components,
        files,
        astResults,
        vueResults,
        processedComponents,
        0 // depth
      );

      // Update page components with expanded list
      page.components = this.deduplicateComponents(expandedComponents);
    }
  }

  /**
   * Recursively get all component dependencies
   */
  private async getComponentDependenciesRecursively(
    components: PageComponent[],
    files: ScannedFile[],
    astResults: AstAnalysisResult[],
    vueResults: VueSfcAnalysisResult[],
    processed: Set<string>,
    depth: number,
    maxDepth: number = 3
  ): Promise<PageComponent[]> {
    if (depth >= maxDepth) return components;

    const allComponents = [...components];

    for (const component of components) {
      if (processed.has(component.name)) continue;
      processed.add(component.name);

      // Find component file
      const componentFile = this.findComponentFile(component, files);
      if (!componentFile) continue;

      // Get analysis results for this component
      const astResult = astResults.find(
        (r) => r.filePath === componentFile.path
      );
      const vueResult = vueResults.find(
        (r) => r.filePath === componentFile.path
      );

      // Extract components used by this component
      const subComponents = this.extractPageComponents(
        astResult,
        vueResult,
        componentFile.path
      );

      // Add depth information to sub-components
      const subComponentsWithDepth = subComponents.map((comp) => ({
        ...comp,
        depth: depth + 1,
        parent: component.name,
      })) as PageComponent[];

      // Recursively get dependencies of sub-components
      const expandedSubComponents =
        await this.getComponentDependenciesRecursively(
          subComponentsWithDepth,
          files,
          astResults,
          vueResults,
          processed,
          depth + 1,
          maxDepth
        );

      allComponents.push(...expandedSubComponents);
    }

    return allComponents;
  }

  /**
   * Find component file by name or import path
   */
  private findComponentFile(
    component: PageComponent,
    files: ScannedFile[]
  ): ScannedFile | null {
    // First try exact import path match
    if (component.importPath) {
      const exactMatch = files.find((f) =>
        f.path.endsWith(component.importPath)
      );
      if (exactMatch) return exactMatch;
    }

    // Try to find by component name
    const nameVariations = [
      `${component.name}.vue`,
      `${component.name}.jsx`,
      `${component.name}.tsx`,
      `${component.name}.js`,
      `${component.name}/index.vue`,
      `${component.name}/index.jsx`,
      `${component.name}/index.tsx`,
      `${component.name}/index.js`,
    ];

    for (const variation of nameVariations) {
      const match = files.find(
        (f) =>
          f.path.endsWith(variation) ||
          f.path.endsWith(`components/${variation}`)
      );
      if (match) return match;
    }

    return null;
  }
}
