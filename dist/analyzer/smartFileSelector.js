import path from 'path';
import { access } from 'fs/promises';
import { createLLMClient } from '../utils/llmClient.js';
/**
 * フレームワーク特定情報に基づいてLLMを活用した高精度ファイル選択を行うクラス
 */
export class SmartFileSelector {
    projectPath;
    llmClient;
    analysisLog = [];
    constructor(projectPath) {
        this.projectPath = projectPath;
        this.llmClient = createLLMClient();
    }
    /**
     * フレームワーク情報を基にスマートなファイル選択を実行
     */
    async selectRelevantFiles(framework, projectStructure, options = {}) {
        this.log('🎯 スマートファイル選択を開始...');
        try {
            // Step 1: フレームワーク固有のファイルパターンを生成
            const frameworkPatterns = this.generateFrameworkSpecificPatterns(framework);
            // Step 2: プロジェクト構造から候補ファイルを抽出
            const candidateFiles = this.extractCandidateFiles(projectStructure, frameworkPatterns);
            // Step 3: LLMを使用してファイルの重要度を評価
            const evaluatedFiles = await this.evaluateFileImportance(framework, candidateFiles, options);
            // Step 4: ファイルを選択・分類
            const result = await this.selectAndCategorizeFiles(framework, evaluatedFiles, options);
            // Step 5: 結果の検証とフォールバック実行
            if (result.selectedFiles.length === 0 || result.confidence < 30) {
                this.log('⚠️ スマートファイル選択の結果が不十分です。フォールバック機能を実行...');
                return await this.fallbackFileSelection(framework, projectStructure, options);
            }
            this.log(`✅ ${result.selectedFiles.length}個のファイルを選択完了`);
            this.log(`📋 スマート選択結果: ${JSON.stringify(result.categorizedFiles)}`);
            this.log(`🎯 選択信頼度: ${result.confidence}%`);
            return result;
        }
        catch (error) {
            this.log(`❌ スマートファイル選択に失敗: ${error}`);
            this.log('🔄 フォールバック機能を実行...');
            return await this.fallbackFileSelection(framework, projectStructure, options);
        }
    }
    /**
     * フレームワーク固有のファイルパターンを生成
     */
    generateFrameworkSpecificPatterns(framework) {
        const basePatterns = [
            ...framework.pagePatterns,
            ...framework.componentPatterns
        ];
        // フレームワーク別の追加パターン
        const frameworkSpecificPatterns = {
            'Next.js': [
                'app/**/*.tsx',
                'app/**/*.jsx',
                'pages/**/*.tsx',
                'pages/**/*.jsx',
                'components/**/*.tsx',
                'components/**/*.jsx',
                'layout.tsx',
                'layout.jsx',
                'loading.tsx',
                'error.tsx',
                'not-found.tsx'
            ],
            'Nuxt.js': [
                'pages/**/*.vue',
                'components/**/*.vue',
                'layouts/**/*.vue',
                'plugins/**/*.js',
                'plugins/**/*.ts',
                'middleware/**/*.js',
                'middleware/**/*.ts',
                'composables/**/*.js',
                'composables/**/*.ts'
            ],
            'Vue.js': [
                'src/**/*.vue',
                'src/components/**/*.vue',
                'src/views/**/*.vue',
                'src/pages/**/*.vue',
                'src/layouts/**/*.vue'
            ],
            'React': [
                'src/**/*.jsx',
                'src/**/*.tsx',
                'src/components/**/*.jsx',
                'src/components/**/*.tsx',
                'src/pages/**/*.jsx',
                'src/pages/**/*.tsx'
            ]
        };
        const specificPatterns = frameworkSpecificPatterns[framework.framework] || [];
        return [...basePatterns, ...specificPatterns];
    }
    /**
     * プロジェクト構造から候補ファイルを抽出
     */
    extractCandidateFiles(projectStructure, patterns) {
        const lines = projectStructure.split('\n');
        const candidateFiles = [];
        // より簡単で確実なアプローチ: 行ごとに直接ファイルを検索
        for (const line of lines) {
            if (!line.trim())
                continue;
            // ファイル名を抽出（tree構造の装飾を除去）
            const cleanLine = line.replace(/^[├└│\s]*/, '').trim();
            // ファイル拡張子をチェック
            const extensions = ['.tsx', '.ts', '.jsx', '.js', '.vue'];
            const hasRelevantExtension = extensions.some(ext => cleanLine.endsWith(ext));
            if (hasRelevantExtension) {
                // src/から始まるパスを構築して候補に追加
                let candidatePath = cleanLine;
                // パスがsrc/で始まっていない場合、適切なパスを推測
                if (!candidatePath.startsWith('src/')) {
                    // 重要なディレクトリに含まれるかチェック
                    const importantDirs = ['dashboard', 'imagings', 'incidents', 'labs', 'medications', 'patients', 'shared', 'scheduling', 'settings', 'user'];
                    const matchedDir = importantDirs.find(dir => line.includes(dir));
                    if (matchedDir) {
                        // src/[dir]/[file] の形式で構築
                        candidatePath = `src/${matchedDir}/${cleanLine}`;
                    }
                    else if (cleanLine.includes('App.') || cleanLine.includes('index.') || cleanLine.includes('HospitalRun.')) {
                        // ルートレベルのファイル
                        candidatePath = `src/${cleanLine}`;
                    }
                }
                // パターンまたは重要性をチェック
                if (this.isRelevantFile(candidatePath, patterns)) {
                    candidateFiles.push(candidatePath);
                }
            }
        }
        this.log(`📋 候補ファイル ${candidateFiles.length}個を抽出`);
        this.log(`📝 抽出例: ${candidateFiles.slice(0, 5).join(', ')}`);
        // デバッグ: 候補が少ない場合、関連ファイルをさらに検索
        if (candidateFiles.length < 5) {
            this.log(`🔍 デバッグ: 関連ファイルを追加検索...`);
            const additionalFiles = this.findAdditionalRelevantFiles(lines);
            candidateFiles.push(...additionalFiles);
            this.log(`📋 追加候補: ${additionalFiles.length}個を発見`);
        }
        return candidateFiles;
    }
    /**
     * 追加の関連ファイルを検索
     */
    findAdditionalRelevantFiles(lines) {
        const additionalFiles = [];
        const extensions = ['.tsx', '.ts', '.jsx', '.js'];
        for (const line of lines) {
            const cleanLine = line.replace(/^[├└│\s]*/, '').trim();
            // 重要なファイル名パターンを直接検索
            const importantPatterns = [
                'App.tsx', 'App.jsx', 'App.ts', 'App.js',
                'index.tsx', 'index.jsx', 'index.ts', 'index.js',
                'HospitalRun.tsx', 'HospitalRun.jsx',
                'Dashboard.tsx', 'Dashboard.jsx',
                'Patients.tsx', 'Patients.jsx'
            ];
            if (importantPatterns.some(pattern => cleanLine.endsWith(pattern))) {
                additionalFiles.push(`src/${cleanLine}`);
            }
            // コンポーネント名を含むファイル（大文字始まり）
            if (extensions.some(ext => cleanLine.endsWith(ext)) && /^[A-Z]/.test(cleanLine)) {
                additionalFiles.push(`src/shared/components/${cleanLine}`);
            }
        }
        return [...new Set(additionalFiles)]; // 重複除去
    }
    /**
     * tree表示の深度を計算
     */
    calculateTreeDepth(prefix) {
        // ├── └── │   などのtree文字をカウント
        const treeChars = prefix.match(/[├└│]/g) || [];
        return treeChars.length;
    }
    /**
     * ファイルが関連性があるかチェック
     */
    isRelevantFile(filePath, patterns) {
        // パターンマッチング
        const matchesPattern = patterns.some(pattern => {
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            return regex.test(filePath);
        });
        if (matchesPattern)
            return true;
        // 重要なディレクトリ・ファイルの判定
        const importantPaths = [
            'src/App.',
            'src/index.',
            'src/HospitalRun.',
            '/components/',
            '/pages/',
            '/views/',
            '/dashboard/',
            '/patients/',
            '/labs/',
            '/medications/',
            '/incidents/',
            '/shared/components/'
        ];
        return importantPaths.some(path => filePath.includes(path));
    }
    /**
     * LLMを使用してファイルの重要度を評価
     */
    async evaluateFileImportance(framework, candidateFiles, options) {
        const prompt = `
あなたは${framework.framework}プロジェクトの解析専門家です。以下の候補ファイル一覧から、ページとコンポーネントの関係性分析に重要なファイルを評価してください。

フレームワーク: ${framework.framework}
信頼度: ${framework.confidence}%

候補ファイル一覧:
${candidateFiles.map((file, index) => `${index + 1}. ${file}`).join('\n')}

評価観点：
1. ページファイルとしての重要度（ルーティングに関連）
2. コンポーネントとしての重要度（再利用性・依存関係）
3. アーキテクチャ理解への貢献度
4. ${framework.framework}固有の重要性

以下の形式でJSONレスポンスを返してください：
{
  "evaluations": [
    {
      "file": "ファイルパス",
      "importance": "重要度スコア (1-10)",
      "category": "page|component|layout|utility|config",
      "reason": "選択理由と重要性の説明",
      "frameworkSpecific": "${framework.framework}固有の特徴があるか (true/false)"
    }
  ],
  "summary": {
    "totalEvaluated": "評価したファイル数",
    "highImportance": "重要度8以上のファイル数",
    "frameworkRelevance": "フレームワーク固有の重要性についての総評"
  }
}

注意：
- importanceは1(低)〜10(高)で評価
- ${framework.framework}の規約・ベストプラクティスを考慮
- ファイル名から推測できる役割を重視
- プロジェクト全体の理解に必要なファイルを優先
`;
        try {
            const response = await this.callLLM(prompt);
            // Clean the response to extract JSON (remove markdown code blocks)
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }
            else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }
            const result = JSON.parse(cleanResponse);
            this.log(`📊 ${result.summary.totalEvaluated}個のファイルを評価完了`);
            this.log(`🔍 高重要度ファイル: ${result.summary.highImportance}個`);
            return result.evaluations || [];
        }
        catch (error) {
            this.log(`⚠️ ファイル重要度評価に失敗: ${error}`);
            // フォールバック: 基本的な重要度を設定
            return candidateFiles.map(file => ({
                file,
                importance: this.calculateBasicImportance(file),
                category: this.guessFileCategory(file),
                reason: 'フォールバック評価'
            }));
        }
    }
    /**
     * 評価されたファイルから最終選択と分類を実行
     */
    async selectAndCategorizeFiles(framework, evaluatedFiles, options) {
        const maxFiles = options.maxFiles || 20;
        // 重要度でソートして上位を選択
        const sortedFiles = evaluatedFiles
            .sort((a, b) => b.importance - a.importance)
            .slice(0, maxFiles);
        // ファイル存在確認
        const validFiles = await this.validateFileExistence(sortedFiles.map(f => f.file));
        const selectedEvaluations = sortedFiles.filter(f => validFiles.includes(f.file));
        // カテゴリー別に分類
        const categorizedFiles = {
            pages: selectedEvaluations.filter(f => f.category === 'page').map(f => f.file),
            components: selectedEvaluations.filter(f => f.category === 'component').map(f => f.file),
            layouts: selectedEvaluations.filter(f => f.category === 'layout').map(f => f.file),
            utilities: selectedEvaluations.filter(f => f.category === 'utility').map(f => f.file),
            config: selectedEvaluations.filter(f => f.category === 'config').map(f => f.file)
        };
        // 選択理由をマッピング
        const selectionReasons = {};
        selectedEvaluations.forEach(evaluation => {
            selectionReasons[evaluation.file] = evaluation.reason;
        });
        // 信頼度を計算（LLM評価成功率ベース）
        const confidence = Math.min(95, (validFiles.length / sortedFiles.length) * 100);
        return {
            selectedFiles: validFiles,
            categorizedFiles,
            selectionReasons,
            confidence
        };
    }
    /**
     * フォールバック機能: 従来の方法でファイルを検索
     */
    async fallbackFileSelection(framework, projectStructure, options = {}) {
        this.log('🔄 フォールバック機能を実行中...');
        // Step 1: プロジェクト構造の分析
        const projectInfo = this.analyzeProjectStructure(projectStructure);
        // Step 2: 基本的なファイル検索
        const basicFiles = this.findBasicFiles(projectStructure, projectInfo);
        // Step 3: 実際に存在するファイルを検索
        const existingFiles = await this.findExistingFiles(projectStructure);
        // Step 4: 両方の結果を統合
        const allFiles = [...new Set([...basicFiles, ...existingFiles])];
        // Step 5: ファイル存在確認
        const validFiles = await this.validateFileExistence(allFiles);
        // Step 6: 基本的な分類
        const categorizedFiles = this.categorizeBasicFiles(validFiles, projectInfo);
        // Step 7: 選択理由の生成
        const selectionReasons = {};
        validFiles.forEach(file => {
            selectionReasons[file] = 'フォールバック機能による基本的な選択';
        });
        const result = {
            selectedFiles: validFiles,
            categorizedFiles,
            selectionReasons,
            confidence: validFiles.length > 0 ? 60 : 0
        };
        this.log(`🔄 フォールバック選択完了: ${validFiles.length}個のファイル`);
        this.log(`📋 フォールバック結果: ${JSON.stringify(categorizedFiles)}`);
        return result;
    }
    /**
     * プロジェクト構造を分析してメタデータを取得
     */
    analyzeProjectStructure(projectStructure) {
        const lines = projectStructure.split('\n');
        const structure = {
            hasSourceDir: false,
            hasAppDir: false,
            hasPagesDir: false,
            hasComponentsDir: false,
            rootDirectory: 'src',
            primaryExtensions: [],
            detectedFramework: 'unknown'
        };
        // ディレクトリ検出
        for (const line of lines) {
            const cleanLine = line.toLowerCase().trim();
            if (cleanLine.includes('src/') || cleanLine.endsWith('src')) {
                structure.hasSourceDir = true;
            }
            if (cleanLine.includes('app/') || cleanLine.endsWith('app')) {
                structure.hasAppDir = true;
            }
            if (cleanLine.includes('pages/') || cleanLine.endsWith('pages')) {
                structure.hasPagesDir = true;
            }
            if (cleanLine.includes('components/') || cleanLine.endsWith('components')) {
                structure.hasComponentsDir = true;
            }
        }
        // ルートディレクトリの決定
        if (structure.hasSourceDir) {
            structure.rootDirectory = 'src';
        }
        else if (structure.hasAppDir) {
            structure.rootDirectory = 'app';
        }
        else {
            structure.rootDirectory = '.';
        }
        // 拡張子の検出
        const extensionCount = { '.tsx': 0, '.ts': 0, '.jsx': 0, '.js': 0, '.vue': 0 };
        for (const line of lines) {
            Object.keys(extensionCount).forEach(ext => {
                if (line.endsWith(ext)) {
                    extensionCount[ext]++;
                }
            });
        }
        structure.primaryExtensions = Object.entries(extensionCount)
            .filter(([, count]) => count > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([ext]) => ext);
        // フレームワーク推定
        if (structure.primaryExtensions.includes('.vue')) {
            structure.detectedFramework = 'Vue';
        }
        else if (structure.primaryExtensions.includes('.tsx') || structure.primaryExtensions.includes('.jsx')) {
            structure.detectedFramework = 'React';
        }
        this.log(`📊 プロジェクト構造分析結果: ${JSON.stringify(structure)}`);
        return structure;
    }
    /**
     * 基本的なファイル検索
     */
    findBasicFiles(projectStructure, projectInfo) {
        const lines = projectStructure.split('\n');
        const basicFiles = [];
        // 重要なファイルパターンを定義
        const importantPatterns = [
            // Entry points
            'App.tsx', 'App.jsx', 'App.ts', 'App.js', 'App.vue',
            'index.tsx', 'index.jsx', 'index.ts', 'index.js', 'index.vue',
            'main.tsx', 'main.jsx', 'main.ts', 'main.js', 'main.vue',
            // Common component names
            'Header.tsx', 'Header.jsx', 'Header.vue',
            'Footer.tsx', 'Footer.jsx', 'Footer.vue',
            'Layout.tsx', 'Layout.jsx', 'Layout.vue',
            'Home.tsx', 'Home.jsx', 'Home.vue',
            'Product.tsx', 'Product.jsx', 'Product.vue',
            'Cart.tsx', 'Cart.jsx', 'Cart.vue',
            'Login.tsx', 'Login.jsx', 'Login.vue',
            'Checkout.tsx', 'Checkout.jsx', 'Checkout.vue',
            // Next.js specific
            'page.tsx', 'page.jsx', 'page.ts', 'page.js',
            'layout.tsx', 'layout.jsx', 'layout.ts', 'layout.js',
            'loading.tsx', 'loading.jsx', 'error.tsx', 'error.jsx',
            'not-found.tsx', 'not-found.jsx'
        ];
        for (const line of lines) {
            const cleanLine = line.replace(/^[├└│\s]*/, '').trim();
            // 重要なファイルパターンをチェック
            if (importantPatterns.some(pattern => cleanLine.endsWith(pattern))) {
                // パスを構築
                let filePath = cleanLine;
                if (projectInfo.hasSourceDir && !cleanLine.includes('src/')) {
                    filePath = `src/${cleanLine}`;
                }
                else if (projectInfo.hasAppDir && !cleanLine.includes('app/')) {
                    filePath = `app/${cleanLine}`;
                }
                basicFiles.push(filePath);
            }
            // 拡張子による検索
            if (projectInfo.primaryExtensions.some(ext => cleanLine.endsWith(ext))) {
                // 重要なディレクトリ内のファイル
                if (line.includes('components/') || line.includes('pages/') ||
                    line.includes('src/') || line.includes('app/')) {
                    let filePath = cleanLine;
                    // tree構造からの相対パス構築
                    const pathParts = line.split('/').filter(part => part.trim() && !part.match(/^[├└│\s]*$/));
                    if (pathParts.length > 1) {
                        filePath = pathParts.join('/');
                    }
                    basicFiles.push(filePath);
                }
            }
        }
        this.log(`🔍 基本検索で${basicFiles.length}個のファイルを発見`);
        return [...new Set(basicFiles)]; // 重複除去
    }
    /**
     * 基本的なファイル分類
     */
    categorizeBasicFiles(files, projectInfo) {
        const categorized = {
            pages: [],
            components: [],
            layouts: [],
            utilities: [],
            config: []
        };
        for (const file of files) {
            const lowerFile = file.toLowerCase();
            // ページファイルの判定
            if (lowerFile.includes('/pages/') || lowerFile.includes('/app/') ||
                lowerFile.endsWith('page.tsx') || lowerFile.endsWith('page.jsx') ||
                lowerFile.includes('home') || lowerFile.includes('product') ||
                lowerFile.includes('cart') || lowerFile.includes('checkout')) {
                categorized.pages.push(file);
            }
            // レイアウトファイルの判定
            else if (lowerFile.includes('layout') || lowerFile.includes('template')) {
                categorized.layouts.push(file);
            }
            // コンポーネントファイルの判定
            else if (lowerFile.includes('/components/') || lowerFile.includes('component') ||
                lowerFile.includes('header') || lowerFile.includes('footer') ||
                lowerFile.includes('nav') || lowerFile.includes('button') ||
                lowerFile.includes('card') || lowerFile.includes('form')) {
                categorized.components.push(file);
            }
            // 設定ファイルの判定
            else if (lowerFile.includes('config') || lowerFile.includes('settings') ||
                lowerFile.includes('.config.') || lowerFile.includes('constants')) {
                categorized.config.push(file);
            }
            // その他はユーティリティとして分類
            else {
                categorized.utilities.push(file);
            }
        }
        return categorized;
    }
    /**
     * ファイル存在確認
     */
    async validateFileExistence(files) {
        const validFiles = [];
        const nonExistentFiles = [];
        this.log(`🔍 ${files.length}個のファイルの存在確認を開始...`);
        for (const file of files) {
            try {
                const filePath = path.join(this.projectPath, file);
                await access(filePath);
                validFiles.push(file);
            }
            catch {
                nonExistentFiles.push(file);
            }
        }
        this.log(`✅ ${validFiles.length}個のファイルが存在確認済み`);
        this.log(`❌ ${nonExistentFiles.length}個のファイルが存在しません`);
        if (nonExistentFiles.length > 0) {
            this.log(`📋 存在しないファイル: ${nonExistentFiles.slice(0, 5).join(', ')}${nonExistentFiles.length > 5 ? '...' : ''}`);
            // 代替案を提案
            const alternatives = await this.suggestFileAlternatives(nonExistentFiles);
            if (alternatives.length > 0) {
                this.log(`🔍 代替案を発見: ${alternatives.length}個のファイル`);
                const validAlternatives = await this.validateFileExistence(alternatives);
                validFiles.push(...validAlternatives);
            }
        }
        return validFiles;
    }
    /**
     * 存在しないファイルの代替案を提案
     */
    async suggestFileAlternatives(nonExistentFiles) {
        const alternatives = [];
        for (const file of nonExistentFiles) {
            const basename = path.basename(file, path.extname(file));
            const dirname = path.dirname(file);
            const ext = path.extname(file);
            // 代替の拡張子を試す
            const alternativeExtensions = ['.tsx', '.ts', '.jsx', '.js', '.vue'];
            for (const altExt of alternativeExtensions) {
                if (altExt !== ext) {
                    const altFile = path.join(dirname, basename + altExt);
                    if (!alternatives.includes(altFile)) {
                        alternatives.push(altFile);
                    }
                }
            }
            // 代替のディレクトリを試す
            const alternativeDirectories = ['src', 'app', 'components', 'pages', 'views'];
            for (const altDir of alternativeDirectories) {
                const altFile = path.join(altDir, path.basename(file));
                if (!alternatives.includes(altFile)) {
                    alternatives.push(altFile);
                }
            }
            // より具体的な代替案
            if (basename.toLowerCase().includes('app')) {
                alternatives.push('src/App.tsx', 'src/App.jsx', 'src/App.js', 'App.tsx', 'App.jsx');
            }
            if (basename.toLowerCase().includes('index')) {
                alternatives.push('src/index.tsx', 'src/index.jsx', 'src/index.js', 'index.tsx', 'index.jsx');
            }
            if (basename.toLowerCase().includes('main')) {
                alternatives.push('src/main.tsx', 'src/main.jsx', 'src/main.js', 'main.tsx', 'main.jsx');
            }
        }
        return [...new Set(alternatives)]; // 重複除去
    }
    /**
     * プロジェクト全体から実際に存在するファイルを検索
     */
    async findExistingFiles(projectStructure) {
        const lines = projectStructure.split('\n');
        const existingFiles = [];
        for (const line of lines) {
            const cleanLine = line.replace(/^[├└│\s]*/, '').trim();
            // ファイル拡張子をチェック
            if (cleanLine.match(/\.(tsx?|jsx?|vue)$/)) {
                // 複数のパス候補を試す
                const pathCandidates = [
                    cleanLine,
                    `src/${cleanLine}`,
                    `app/${cleanLine}`,
                    `components/${cleanLine}`,
                    `pages/${cleanLine}`
                ];
                for (const candidate of pathCandidates) {
                    try {
                        const filePath = path.join(this.projectPath, candidate);
                        await access(filePath);
                        existingFiles.push(candidate);
                        break; // 最初に見つかったパスを使用
                    }
                    catch {
                        // ファイルが存在しない場合は次の候補を試す
                    }
                }
            }
        }
        return [...new Set(existingFiles)]; // 重複除去
    }
    /**
     * 基本的な重要度計算（フォールバック用）
     */
    calculateBasicImportance(file) {
        if (file.includes('/pages/') || file.includes('/app/'))
            return 9;
        if (file.includes('/components/'))
            return 7;
        if (file.includes('/layouts/'))
            return 6;
        if (file.includes('index.') || file.includes('App.'))
            return 8;
        return 5;
    }
    /**
     * ファイルカテゴリーの推測（フォールバック用）
     */
    guessFileCategory(file) {
        if (file.includes('/pages/') || file.includes('/app/'))
            return 'page';
        if (file.includes('/components/'))
            return 'component';
        if (file.includes('/layouts/'))
            return 'layout';
        if (file.includes('config'))
            return 'config';
        return 'utility';
    }
    /**
     * LLM API呼び出し
     */
    async callLLM(prompt) {
        this.log('🧠 LLMを呼び出し中...');
        return await this.llmClient.chat(prompt);
    }
    /**
     * ログ出力
     */
    log(message) {
        this.analysisLog.push(`${new Date().toISOString()}: ${message}`);
        console.log(message);
    }
    /**
     * 解析ログを取得
     */
    getAnalysisLog() {
        return [...this.analysisLog];
    }
}
//# sourceMappingURL=smartFileSelector.js.map