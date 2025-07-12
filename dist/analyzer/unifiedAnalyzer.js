import { createLLMClient } from '../utils/llmClient.js';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileScanner } from './fileScanner.js';
export class UnifiedAnalyzer {
    projectPath;
    llmClient;
    analysisLog = [];
    startTime = 0;
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.llmClient = createLLMClient();
    }
    async analyze() {
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
                analysisLog: this.analysisLog
            };
        }
        catch (error) {
            this.log(`❌ 解析中にエラーが発生しました: ${error}`);
            throw error;
        }
    }
    async scanFiles() {
        const scanResult = await fileScanner.scanProject(this.projectPath, {
            maxDepth: 10,
            includeHidden: false,
        });
        return scanResult.files;
    }
    async detectFramework() {
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
        const configInfo = [];
        for (const file of configFiles) {
            try {
                const content = await readFile(path.join(this.projectPath, file), 'utf-8');
                configInfo.push(`=== ${file} ===\n${content.slice(0, 2000)}\n`);
            }
            catch {
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
        const response = await this.llmClient.chat(prompt);
        try {
            // More robust JSON cleaning
            let cleanResponse = response.trim();
            // Remove markdown code blocks
            cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/\s*```/g, '');
            // Find JSON object
            const jsonStart = cleanResponse.indexOf('{');
            const jsonEnd = cleanResponse.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
            }
            return JSON.parse(cleanResponse);
        }
        catch (error) {
            this.log(`⚠️ LLM応答の解析に失敗しました: ${error}`);
            // フォールバック: package.json から推測
            return await this.detectFrameworkFallback();
        }
    }
    async detectFrameworkFallback() {
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
        }
        catch {
            return {
                name: 'Unknown',
                confidence: 0,
                pagePatterns: [],
                componentPatterns: []
            };
        }
    }
    async getStructureHints() {
        const dirs = ['pages', 'app', 'src', 'components', 'views', 'layouts'];
        const hints = [];
        for (const dir of dirs) {
            try {
                const { stat } = await import('fs/promises');
                await stat(path.join(this.projectPath, dir));
                hints.push(`✅ ${dir}/`);
            }
            catch {
                hints.push(`❌ ${dir}/`);
            }
        }
        return hints.join('\n');
    }
    async identifyPages(files, framework) {
        this.log('📄 ページファイルを特定中...');
        // JavaScript/TypeScript/Vueファイルをフィルタリング
        const candidateFiles = files.filter(file => /\.(js|jsx|ts|tsx|vue)$/.test(file.path) &&
            !file.path.includes('node_modules') &&
            !file.path.includes('.test.') &&
            !file.path.includes('.spec.') &&
            !file.path.includes('stories.'));
        if (candidateFiles.length === 0) {
            this.log('⚠️ 候補ファイルが見つかりませんでした');
            return [];
        }
        // ファイルリストを作成
        const fileList = candidateFiles.map(file => ({
            path: file.relativePath,
            name: path.basename(file.path),
            size: file.size || 0
        }));
        const prompt = `You are a frontend architect. Identify actual page components from this ${framework.name} project.

Framework: ${framework.name}
Files:
${fileList.map(f => `- ${f.path} (${f.size}B)`).join('\n')}

Criteria for page identification:
1. Actual user-facing pages (Home, Product, Cart, Login, etc.)
2. Exclude root files like App.js, index.js
3. Exclude common components (Header, Footer, Button, etc.)
4. Exclude utility and helper files

Return ONLY valid JSON in this exact format:
{
  "pages": [
    {
      "name": "Page Name",
      "filePath": "file/path",
      "route": "/estimated-route",
      "reason": "Why this is identified as a page"
    }
  ]
}`;
        const response = await this.llmClient.chat(prompt);
        try {
            // More robust JSON cleaning
            let cleanResponse = response.trim();
            // Remove markdown code blocks
            cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/\s*```/g, '');
            // Find JSON object
            const jsonStart = cleanResponse.indexOf('{');
            const jsonEnd = cleanResponse.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
            }
            const result = JSON.parse(cleanResponse);
            return result.pages.map((page) => ({
                name: page.name,
                filePath: page.filePath,
                route: page.route,
                components: [],
                reason: page.reason
            }));
        }
        catch (error) {
            this.log(`⚠️ ページ特定に失敗しました: ${error}`);
            return [];
        }
    }
    async analyzePageComponents(pages, files, framework) {
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
                // LLMでコンポーネントを解析
                const components = await this.extractComponentsFromPage(content, page.name, framework);
                page.components = components;
                this.log(`📄 ${page.name}: ${components.length}個のコンポーネント`);
            }
            catch (error) {
                this.log(`❌ ${page.name}の解析に失敗: ${error}`);
            }
        }
    }
    async extractComponentsFromPage(content, pageName, framework) {
        const prompt = `You are a ${framework.name} expert. Identify components used in this page component.

Page: ${pageName}
Code:
${content.slice(0, 3000)}

Identify components based on:
1. Import statements that clearly indicate components
2. Actually used in JSX or template
3. Exclude DOM elements (div, span, etc.)
4. Include external library components

Return ONLY valid JSON in this exact format:
{
  "components": [
    {
      "name": "Component Name",
      "type": "component",
      "filePath": "estimated/file/path"
    }
  ]
}`;
        try {
            const response = await this.llmClient.chat(prompt);
            // More robust JSON cleaning
            let cleanResponse = response.trim();
            // Remove markdown code blocks
            cleanResponse = cleanResponse.replace(/```json\s*/g, '').replace(/\s*```/g, '');
            // Find JSON object
            const jsonStart = cleanResponse.indexOf('{');
            const jsonEnd = cleanResponse.lastIndexOf('}');
            if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
            }
            const result = JSON.parse(cleanResponse);
            return result.components.map((comp) => ({
                name: comp.name,
                type: comp.type,
                filePath: comp.filePath || undefined,
                children: []
            }));
        }
        catch (error) {
            this.log(`⚠️ コンポーネント抽出に失敗: ${error}`);
            return [];
        }
    }
    log(message) {
        this.analysisLog.push(message);
        console.log(message);
    }
}
//# sourceMappingURL=unifiedAnalyzer.js.map