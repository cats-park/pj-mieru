import * as fs from 'fs';
import * as path from 'path';
import { createLLMClient } from '../utils/llmClient.js';
export class TechStackAnalyzer {
    async analyzeTechStack(projectPath, files) {
        const packageJson = await this.readPackageJson(projectPath);
        const languages = this.analyzeLanguages(files);
        const frameworks = await this.analyzeFrameworksWithLLM(projectPath, packageJson, files);
        const buildTools = await this.analyzeBuildTools(projectPath, files);
        const packageManager = this.detectPackageManager(projectPath);
        return {
            languages,
            frameworks,
            buildTools,
            packageManager,
            primaryFramework: this.determinePrimaryFramework(frameworks),
            primaryLanguage: this.determinePrimaryLanguage(languages),
        };
    }
    async readPackageJson(projectPath) {
        try {
            const packageJsonPath = path.join(projectPath, 'package.json');
            const content = await fs.promises.readFile(packageJsonPath, 'utf-8');
            return JSON.parse(content);
        }
        catch {
            return null;
        }
    }
    analyzeLanguages(files) {
        const languageMap = new Map();
        const totalFiles = files.length;
        // 言語マッピング
        const extensionToLanguage = {
            '.js': 'JavaScript',
            '.jsx': 'JavaScript (JSX)',
            '.ts': 'TypeScript',
            '.tsx': 'TypeScript (TSX)',
            '.vue': 'Vue.js',
            '.py': 'Python',
            '.java': 'Java',
            '.go': 'Go',
            '.rs': 'Rust',
            '.php': 'PHP',
            '.rb': 'Ruby',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.dart': 'Dart',
            '.css': 'CSS',
            '.scss': 'Sass/SCSS',
            '.less': 'Less',
            '.html': 'HTML',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yml': 'YAML',
            '.yaml': 'YAML',
        };
        files.forEach(file => {
            const language = extensionToLanguage[file.extension];
            if (language) {
                if (!languageMap.has(language)) {
                    languageMap.set(language, { count: 0, extensions: new Set() });
                }
                const info = languageMap.get(language);
                info.count++;
                info.extensions.add(file.extension);
            }
        });
        return Array.from(languageMap.entries())
            .map(([name, info]) => ({
            name,
            percentage: Math.round((info.count / totalFiles) * 100),
            fileCount: info.count,
            extensions: Array.from(info.extensions),
        }))
            .sort((a, b) => b.percentage - a.percentage);
    }
    async analyzeFrameworksWithLLM(projectPath, packageJson, files) {
        try {
            const llmClient = createLLMClient();
            const projectContext = await this.gatherProjectContext(projectPath, packageJson, files);
            const prompt = this.buildFrameworkAnalysisPrompt(projectContext);
            const response = await llmClient.chat(prompt);
            return this.parseLLMFrameworkResponse(response);
        }
        catch (error) {
            console.warn('LLM framework analysis failed, falling back to traditional method:', error);
            return this.analyzeFrameworksTraditional(packageJson, files);
        }
    }
    async gatherProjectContext(projectPath, packageJson, files) {
        const configFiles = await this.readConfigFiles(projectPath, files);
        const fileStructure = this.analyzeFileStructure(files);
        const codeSnippets = await this.extractCodeSnippets(projectPath, files);
        return {
            packageJson,
            configFiles,
            fileStructure,
            codeSnippets,
            directoryStructure: this.getDirectoryStructure(files),
        };
    }
    buildFrameworkAnalysisPrompt(context) {
        return `Analyze this project and identify all frameworks and libraries being used. Return a JSON array of framework objects.

Project Context:
- Package.json: ${JSON.stringify(context.packageJson, null, 2)}
- Config Files: ${JSON.stringify(context.configFiles, null, 2)}
- File Structure: ${JSON.stringify(context.fileStructure, null, 2)}
- Directory Structure: ${JSON.stringify(context.directoryStructure, null, 2)}
- Code Snippets: ${JSON.stringify(context.codeSnippets, null, 2)}

Please analyze and return a JSON array with the following structure:
[
  {
    "name": "Framework Name",
    "version": "version if available",
    "confidence": "high|medium|low",
    "indicators": ["list of indicators that led to this detection"]
  }
]

Focus on detecting:
- Frontend frameworks (React, Vue.js, Angular, Svelte)
- Meta-frameworks (Next.js, Nuxt.js, Gatsby, SvelteKit)
- Backend frameworks (Express.js, Fastify, Koa)
- Build tools (Vite, Webpack, Rollup)
- UI libraries (Material-UI, Ant Design, Chakra UI)

Return only the JSON array, no additional text.`;
    }
    parseLLMFrameworkResponse(response) {
        try {
            // Clean the response to extract JSON
            const jsonMatch = response.match(/\[.*\]/s);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            const frameworks = JSON.parse(jsonMatch[0]);
            // Validate and normalize the response
            return frameworks
                .filter(f => f.name && f.confidence)
                .map(f => ({
                name: f.name,
                version: f.version || undefined,
                confidence: ['high', 'medium', 'low'].includes(f.confidence) ? f.confidence : 'medium',
                indicators: Array.isArray(f.indicators) ? f.indicators : ['LLM Analysis'],
            }));
        }
        catch (error) {
            console.warn('Failed to parse LLM framework response:', error);
            return [];
        }
    }
    async readConfigFiles(projectPath, files) {
        const configFiles = {};
        const configFileNames = [
            'next.config.js', 'next.config.ts', 'next.config.mjs',
            'nuxt.config.js', 'nuxt.config.ts',
            'vue.config.js', 'vue.config.ts',
            'gatsby-config.js', 'gatsby-config.ts',
            'vite.config.js', 'vite.config.ts',
            'webpack.config.js', 'webpack.config.ts',
            'rollup.config.js', 'rollup.config.ts',
            'svelte.config.js', 'svelte.config.ts',
            'angular.json', '.angular-cli.json',
            'tsconfig.json', 'jsconfig.json',
            '.babelrc', 'babel.config.js',
            'tailwind.config.js', 'tailwind.config.ts'
        ];
        for (const fileName of configFileNames) {
            try {
                const filePath = path.join(projectPath, fileName);
                const content = await fs.promises.readFile(filePath, 'utf-8');
                configFiles[fileName] = content.slice(0, 1000); // Limit content size
            }
            catch {
                // File doesn't exist, skip
            }
        }
        return configFiles;
    }
    analyzeFileStructure(files) {
        const extensions = new Map();
        const directories = new Set();
        const specialFiles = [];
        files.forEach(file => {
            extensions.set(file.extension, (extensions.get(file.extension) || 0) + 1);
            directories.add(path.dirname(file.relativePath));
            // Track special files
            if (['pages', 'app', 'src', 'components', 'layouts', 'plugins', 'middleware'].some(dir => file.relativePath.includes(dir))) {
                specialFiles.push(file.relativePath);
            }
        });
        return {
            extensions: Object.fromEntries(extensions),
            directories: Array.from(directories).slice(0, 50), // Limit
            specialFiles: specialFiles.slice(0, 30), // Limit
            totalFiles: files.length
        };
    }
    async extractCodeSnippets(projectPath, files) {
        const snippets = {};
        const importantFiles = files
            .filter(f => ['package.json', 'index.js', 'index.ts', 'main.js', 'main.ts', 'app.js', 'app.ts', 'App.vue', 'App.tsx', 'App.jsx'].includes(f.name))
            .slice(0, 5); // Limit to 5 files
        for (const file of importantFiles) {
            try {
                const filePath = path.join(projectPath, file.relativePath);
                const content = await fs.promises.readFile(filePath, 'utf-8');
                snippets[file.relativePath] = content.slice(0, 500); // First 500 chars
            }
            catch {
                // Skip if can't read
            }
        }
        return snippets;
    }
    getDirectoryStructure(files) {
        const dirs = new Set();
        files.forEach(file => {
            const pathParts = file.relativePath.split(path.sep);
            for (let i = 1; i <= Math.min(pathParts.length - 1, 3); i++) {
                dirs.add(pathParts.slice(0, i).join(path.sep));
            }
        });
        return Array.from(dirs).slice(0, 30); // Limit to 30 directories
    }
    analyzeFrameworksTraditional(packageJson, files) {
        const frameworks = [];
        if (packageJson) {
            const dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
            // React検出
            if (dependencies.react) {
                frameworks.push({
                    name: 'React',
                    version: dependencies.react,
                    confidence: 'high',
                    indicators: ['package.json dependencies', 'JSX files'],
                });
            }
            // Vue.js検出
            if (dependencies.vue || files.some(f => f.extension === '.vue')) {
                frameworks.push({
                    name: 'Vue.js',
                    version: dependencies.vue,
                    confidence: 'high',
                    indicators: ['.vue files', 'package.json dependencies'],
                });
            }
            // Next.js検出
            if (dependencies.next) {
                frameworks.push({
                    name: 'Next.js',
                    version: dependencies.next,
                    confidence: 'high',
                    indicators: ['package.json dependencies'],
                });
            }
            // Nuxt.js検出
            if (dependencies.nuxt || dependencies['@nuxt/kit']) {
                frameworks.push({
                    name: 'Nuxt.js',
                    version: dependencies.nuxt || dependencies['@nuxt/kit'],
                    confidence: 'high',
                    indicators: ['package.json dependencies'],
                });
            }
        }
        // ファイル構造による推測
        if (files.some(f => f.name === 'gatsby-config.js')) {
            frameworks.push({
                name: 'Gatsby',
                confidence: 'high',
                indicators: ['gatsby-config.js'],
            });
        }
        return frameworks;
    }
    async analyzeBuildTools(projectPath, files) {
        const buildTools = [];
        const configFileMap = {
            'webpack.config.js': 'Webpack',
            'rollup.config.js': 'Rollup',
            'vite.config.js': 'Vite',
            'vite.config.ts': 'Vite',
            'esbuild.config.js': 'ESBuild',
            'tsconfig.json': 'TypeScript',
            '.babelrc': 'Babel',
            'babel.config.js': 'Babel',
            'eslintrc.js': 'ESLint',
            '.eslintrc.json': 'ESLint',
            'prettier.config.js': 'Prettier',
            '.prettierrc': 'Prettier',
        };
        files.forEach(file => {
            const toolName = configFileMap[file.name];
            if (toolName && !buildTools.some(t => t.name === toolName)) {
                buildTools.push({
                    name: toolName,
                    configFiles: [file.name],
                });
            }
        });
        return buildTools;
    }
    detectPackageManager(projectPath) {
        const lockFiles = [
            { file: 'package-lock.json', manager: 'npm' },
            { file: 'yarn.lock', manager: 'yarn' },
            { file: 'pnpm-lock.yaml', manager: 'pnpm' },
            { file: 'bun.lockb', manager: 'bun' },
        ];
        for (const { file, manager } of lockFiles) {
            try {
                fs.accessSync(path.join(projectPath, file));
                return manager;
            }
            catch {
                // File doesn't exist, continue
            }
        }
        return 'npm'; // デフォルト
    }
    determinePrimaryFramework(frameworks) {
        if (frameworks.length === 0)
            return 'Unknown';
        // メタフレームワークを優先（Next.js, Nuxt.js, Gatsby など）
        const metaFrameworks = frameworks.filter(f => ['Next.js', 'Nuxt.js', 'Gatsby', 'SvelteKit'].includes(f.name));
        if (metaFrameworks.length > 0) {
            return metaFrameworks[0].name;
        }
        // 高信頼度のフレームワークを優先
        const highConfidence = frameworks.filter(f => f.confidence === 'high');
        if (highConfidence.length > 0) {
            return highConfidence[0].name;
        }
        return frameworks[0].name;
    }
    determinePrimaryLanguage(languages) {
        if (languages.length === 0)
            return 'Unknown';
        // CSS, JSON, HTMLなどの設定ファイルを除外して主要言語を決定
        const codeLanguages = languages.filter(l => !['CSS', 'JSON', 'HTML', 'YAML', 'XML'].includes(l.name));
        return codeLanguages.length > 0 ? codeLanguages[0].name : languages[0].name;
    }
}
//# sourceMappingURL=techStackAnalyzer.js.map