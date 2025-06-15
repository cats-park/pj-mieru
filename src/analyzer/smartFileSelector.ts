import path from 'path';
import { readFile, access } from 'fs/promises';
import { createLLMClient, LLMClient } from '../utils/llmClient.js';
import { FrameworkDetectionResult } from './intelligentAnalyzer.js';

export interface SmartFileSelectorOptions {
  maxFiles?: number;
  prioritizeRecentFiles?: boolean;
  includeConfigFiles?: boolean;
  customPatterns?: string[];
}

export interface FileSelectionResult {
  selectedFiles: string[];
  categorizedFiles: {
    pages: string[];
    components: string[];
    layouts: string[];
    utilities: string[];
    config: string[];
  };
  selectionReasons: Record<string, string>;
  confidence: number;
}

/**
 * フレームワーク特定情報に基づいてLLMを活用した高精度ファイル選択を行うクラス
 */
export class SmartFileSelector {
  private projectPath: string;
  private llmClient: LLMClient;
  private analysisLog: string[] = [];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.llmClient = createLLMClient();
  }

  /**
   * フレームワーク情報を基にスマートなファイル選択を実行
   */
  async selectRelevantFiles(
    framework: FrameworkDetectionResult,
    projectStructure: string,
    options: SmartFileSelectorOptions = {}
  ): Promise<FileSelectionResult> {
    this.log('🎯 スマートファイル選択を開始...');

    // Step 1: フレームワーク固有のファイルパターンを生成
    const frameworkPatterns = this.generateFrameworkSpecificPatterns(framework);
    
    // Step 2: プロジェクト構造から候補ファイルを抽出
    const candidateFiles = this.extractCandidateFiles(projectStructure, frameworkPatterns);
    
    // Step 3: LLMを使用してファイルの重要度を評価
    const evaluatedFiles = await this.evaluateFileImportance(
      framework,
      candidateFiles,
      options
    );
    
    // Step 4: ファイルを選択・分類
    const result = await this.selectAndCategorizeFiles(
      framework,
      evaluatedFiles,
      options
    );

    this.log(`✅ ${result.selectedFiles.length}個のファイルを選択完了`);
    return result;
  }

  /**
   * フレームワーク固有のファイルパターンを生成
   */
  private generateFrameworkSpecificPatterns(framework: FrameworkDetectionResult): string[] {
    const basePatterns = [
      ...framework.pagePatterns,
      ...framework.componentPatterns
    ];

    // フレームワーク別の追加パターン
    const frameworkSpecificPatterns: Record<string, string[]> = {
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
  private extractCandidateFiles(
    projectStructure: string,
    patterns: string[]
  ): string[] {
    const lines = projectStructure.split('\n');
    const candidateFiles: string[] = [];
    
    // より簡単で確実なアプローチ: 行ごとに直接ファイルを検索
    for (const line of lines) {
      if (!line.trim()) continue;
      
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
          } else if (cleanLine.includes('App.') || cleanLine.includes('index.') || cleanLine.includes('HospitalRun.')) {
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
  private findAdditionalRelevantFiles(lines: string[]): string[] {
    const additionalFiles: string[] = [];
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
  private calculateTreeDepth(prefix: string): number {
    // ├── └── │   などのtree文字をカウント
    const treeChars = prefix.match(/[├└│]/g) || [];
    return treeChars.length;
  }

  /**
   * ファイルが関連性があるかチェック
   */
  private isRelevantFile(filePath: string, patterns: string[]): boolean {
    // パターンマッチング
    const matchesPattern = patterns.some(pattern => {
      const regex = new RegExp(
        pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')
      );
      return regex.test(filePath);
    });
    
    if (matchesPattern) return true;
    
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
  private async evaluateFileImportance(
    framework: FrameworkDetectionResult,
    candidateFiles: string[],
    options: SmartFileSelectorOptions
  ): Promise<Array<{file: string, importance: number, category: string, reason: string}>> {
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
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      const result = JSON.parse(cleanResponse);
      
      this.log(`📊 ${result.summary.totalEvaluated}個のファイルを評価完了`);
      this.log(`🔍 高重要度ファイル: ${result.summary.highImportance}個`);
      
      return result.evaluations || [];
    } catch (error) {
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
  private async selectAndCategorizeFiles(
    framework: FrameworkDetectionResult,
    evaluatedFiles: Array<{file: string, importance: number, category: string, reason: string}>,
    options: SmartFileSelectorOptions
  ): Promise<FileSelectionResult> {
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
    const selectionReasons: Record<string, string> = {};
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
   * ファイル存在確認
   */
  private async validateFileExistence(files: string[]): Promise<string[]> {
    const validFiles: string[] = [];
    
    for (const file of files) {
      try {
        const filePath = path.join(this.projectPath, file);
        await access(filePath);
        validFiles.push(file);
      } catch {
        this.log(`⚠️ ファイル不存在: ${file}`);
      }
    }
    
    return validFiles;
  }

  /**
   * 基本的な重要度計算（フォールバック用）
   */
  private calculateBasicImportance(file: string): number {
    if (file.includes('/pages/') || file.includes('/app/')) return 9;
    if (file.includes('/components/')) return 7;
    if (file.includes('/layouts/')) return 6;
    if (file.includes('index.') || file.includes('App.')) return 8;
    return 5;
  }

  /**
   * ファイルカテゴリーの推測（フォールバック用）
   */
  private guessFileCategory(file: string): string {
    if (file.includes('/pages/') || file.includes('/app/')) return 'page';
    if (file.includes('/components/')) return 'component';
    if (file.includes('/layouts/')) return 'layout';
    if (file.includes('config')) return 'config';
    return 'utility';
  }

  /**
   * LLM API呼び出し
   */
  private async callLLM(prompt: string): Promise<string> {
    this.log('🧠 LLMを呼び出し中...');
    return await this.llmClient.chat(prompt);
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