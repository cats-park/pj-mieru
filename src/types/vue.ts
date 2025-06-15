import {
  ImportInfo,
  ComponentUsage,
  ExportInfo,
  DefinitionInfo,
} from './ast.js';

/**
 * Vueコンポーネントのスクリプトブロック情報
 */
export interface VueScriptBlock {
  content: string;
  lang?: string;
  setup?: boolean;
  attrs: Record<string, string | boolean>;
  startLine: number;
  endLine: number;
}

/**
 * Vueコンポーネントのテンプレートブロック情報
 */
export interface VueTemplateBlock {
  content: string;
  lang?: string;
  attrs: Record<string, string | boolean>;
  startLine: number;
  endLine: number;
}

/**
 * Vueコンポーネントのスタイルブロック情報
 */
export interface VueStyleBlock {
  content: string;
  lang?: string;
  scoped?: boolean;
  module?: boolean | string;
  attrs: Record<string, string | boolean>;
  startLine: number;
  endLine: number;
}

/**
 * Vue SFC解析結果
 */
export interface VueSfcAnalysisResult {
  /** ファイルパス */
  filePath: string;
  /** 解析成功フラグ */
  success: boolean;
  /** エラーメッセージ（解析失敗時） */
  error?: string;
  /** スクリプトブロック */
  script?: VueScriptBlock;
  /** テンプレートブロック */
  template?: VueTemplateBlock;
  /** スタイルブロック */
  styles: VueStyleBlock[];
  /** インポート情報 */
  imports: ImportInfo[];
  /** エクスポート情報 */
  exports: ExportInfo[];
  /** 定義情報（関数、変数、クラスなど） */
  definitions: DefinitionInfo[];
  /** コンポーネント使用情報 */
  componentUsages: ComponentUsage[];
  /** カスタムブロック */
  customBlocks: Array<{
    type: string;
    content: string;
    attrs: Record<string, string | boolean>;
    startLine: number;
    endLine: number;
  }>;
}

/**
 * Vue SFC解析オプション
 */
export interface VueSfcAnalysisOptions {
  /** TypeScriptサポート */
  typescript?: boolean;
  /** JSXサポート */
  jsx?: boolean;
  /** カスタムブロックを含めるか */
  includeCustomBlocks?: boolean;
  /** スタイルブロックを解析するか */
  analyzeStyles?: boolean;
  /** ソースマップ生成 */
  sourceMap?: boolean;
}
