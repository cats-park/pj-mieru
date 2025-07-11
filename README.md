# Project Mieru (プロジェクト見える)

Advanced component visualization tool for Vue.js, React, Nuxt.js, and Next.js projects. Clean, optimized codebase with intelligent Mermaid diagram generation.

## Overview

プロジェクト見える（Project Mieru）は、現代のWebフレームワークにおけるコンポーネントとページの関係性を**美しく視覚化**するCLIツールです。

**独自のネストしたsubgraph構造**により、コンポーネント内で使用される子コンポーネントまで階層的に表現。直感的なカラーテーマで、ページ（緑）とコンポーネント（青系濃淡）を区別し、プロジェクトの構造を一目で理解できます。

LLMを活用したインテリジェント解析により、従来のツールでは実現できない深いプロジェクト構造の理解を提供します。

### ✨ Features

- 🧠 **AI-Powered Analysis** - LLMを活用したフレームワーク自動検出とコンポーネント分析
- 📊 **Nested Component Visualization** - ページ内のコンポーネント階層を美しいsubgraph構造で表現
- 🎨 **Color-Coded Architecture** - ページ（緑）・コンポーネント（青）・ネスト構造（濃淡）の直感的な色分け
- 🎯 **Multi-Framework Support** - Vue.js、React、Nuxt.js、Next.jsに対応
- 🌐 **GitHub Integration** - ローカルプロジェクトとGitHubリポジトリ両方に対応
- 📋 **Interactive Mermaid Diagrams** - 実用的で見やすいMermaid図を含むMarkdownレポート生成
- 🔍 **Recursive Dependency Analysis** - 最大3階層のコンポーネント依存関係を詳細分析
- ⚡ **Fast Processing** - TypeScript AST解析による高速処理
- 🧹 **Auto Cleanup** - 一時ファイルの自動クリーンアップ

### 🚀 Supported Frameworks

- ✅ **Vue.js** - SFC (Single File Components) 完全対応
- ✅ **React** - JSX/TSX コンポーネント解析
- ✅ **Nuxt.js** - ページ構造とコンポーネント関係
- ✅ **Next.js** - App Router / Pages Router 両対応

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd project-mieru

# Install dependencies
npm install

# Build the project
npm run build
```

## 🔧 Usage

### ローカルプロジェクト解析

```bash
# ページ構造解析（デフォルトでLLMインテリジェント解析が有効）
mieru analyze ./your-project

# ページ-コンポーネント関係詳細解析
mieru analyze ./your-project --format page-component
```

> **Note:**
> Project MieruはデフォルトでLLM（AI）ベースのインテリジェント解析を行います。従来の `--format intelligent` オプションは不要です。

### GitHub リポジトリ解析

```bash
# GitHub リポジトリのページ構造解析（デフォルトでLLM解析）
mieru analyze https://github.com/username/repository

# GitHub リポジトリの特定ブランチ解析
mieru analyze https://github.com/username/repository/tree/develop

# GitHub リポジトリの特定ディレクトリ解析
mieru analyze https://github.com/username/repository/tree/main/frontend
```

### Advanced Options

```bash
# 出力ファイル名を指定
mieru analyze ./project --output my-analysis
mieru analyze https://github.com/user/repo --output github-analysis

# ディレクトリグループ化
mieru analyze ./project --group-by-directory

# 使用コンテキスト表示
mieru analyze ./project --show-usage-context

# シンプルな図表生成
mieru analyze ./project --diagram-type simple

# 明示的に従来形式で出力したい場合
mieru analyze ./project --format page-component
```

> **補足:**
> `--format` オプションは、`page-component` など従来形式での出力を明示したい場合にのみ使用してください。

## 🎨 Visual Features

### カラーテーマ

Project Mieruは直感的な色分けでプロジェクト構造を視覚化します：

- 🟢 **ページ** - 緑系統（`#E8F5E8` 背景、`#4CAF50` 枠線）
- 🔵 **通常コンポーネント** - 薄青（`#7BB3F0` 背景）
- 🔷 **親コンポーネント** - 中青（`#4A90E2` 背景）
- 🔹 **子コンポーネント** - 濃青（`#2E5A8A` 背景）

### ネストした構造表現

コンポーネント内でさらにコンポーネントが使用されている場合、subgraph構造で階層を表現：

```mermaid
subgraph page1 ["📄 pages/profile.vue"]
  subgraph sidebar ["🧩 ProfileSidebar"]
    search["🧩 SearchForm"]
    menu["🧩 NavigationMenu"]
  end
  content["🧩 ProfileContent"]
end
```

### Configuration

```bash
# 設定ファイルを生成
mieru init

# 既存設定を上書き
mieru init --force
```

## 🔑 LLM Integration

### 🧠 **サポートされるLLMプロバイダー**

| プロバイダー | モデル | 用途 | ステータス |
|-------------|--------|------|----------|
| **OpenAI** | GPT-4, GPT-3.5 | コード解析・フレームワーク検出 | ✅ 実装済み |
| **Anthropic** | Claude-3 | 高精度アーキテクチャ分析 | ✅ 実装済み |
| **Perplexity** | Llama, Mistral | ファスト解析 | ✅ 実装済み |

### 🔐 **APIキー設定**

```bash
# .envファイルを作成して以下のキーを設定

# OpenAI (推奨)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Anthropic Claude (高精度解析)
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here

# Perplexity (高速解析)
PERPLEXITY_API_KEY=pplx-your_perplexity_key_here
```

### 🎆 **インテリジェント機能**

- **スマートフレームワーク検出**: package.json、ファイル構造、import文からAIが自動判定
- **コンポーネントタイプ分類**: UIコンポーネント、ロジックコンポーネント、ユーティリティの自動分類
- **アーキテクチャパターン識別**: MVC、MVVM、Composition API等のパターン検出
- **信頼度スコア**: 各判定の確度を数値化 (high/medium/low)

## 📊 Output Formats

### 🏗️ **アーキテクチャ概要**

```mermaid
graph TD
    A["CLI Entry Point<br/>(src/cli.ts)"] --> B["Commander.js<br/>(src/cli/index.ts)"]
    B --> C["File Scanner<br/>(analyzer/fileScanner.ts)"]
    C --> D["AST Parser<br/>(analyzer/astParser.ts)"]
    C --> E["Vue SFC Parser<br/>(analyzer/vueSfcParser.ts)"]
    D --> F["Page Analyzer<br/>(analyzer/pageAnalyzer.ts)"]
    E --> F
    F --> G["Tech Stack Analyzer<br/>(analyzer/techStackAnalyzer.ts)"]
    F --> H["Intelligent Analyzer<br/>(analyzer/intelligentAnalyzer.ts)"]
    G --> I["Mermaid Generator<br/>(generators/mermaidGenerator.ts)"]
    H --> J["Intelligent Mermaid Generator<br/>(generators/intelligentMermaidGenerator.ts)"]
    I --> K["Markdown Report"]
    J --> K
```

### 📋 **Page Structure Report**

- **技術スタック解析**: 言語・フレームワーク・ビルドツール・パッケージマネージャーの自動検出
- **ネストしたコンポーネント階層**: subgraph構造でコンポーネントの親子関係を視覚化（最大3階層）
- **カラーコード図表**: 緑（ページ）・青系（コンポーネント）の直感的な色分け
- **統一されたsubgraph**: 空のページも統一感のあるスタイルで表示
- **詳細統計情報**: ページ数・コンポーネント数・解析時間・技術構成
- **GitHub統合**: リポジトリURL、ブランチ、サブディレクトリ対応

**レポート例**:

```markdown
# ページ構造解析レポート

**生成日時**: 2025/6/13 9:34:29
**参照元**: [https://github.com/username/repository](https://github.com/username/repository)

## 🚀 技術スタック

### 主要技術
- **言語**: JavaScript
- **フレームワーク**: React
- **パッケージマネージャー**: npm

### 言語構成
- **JavaScript**: 85% (120ファイル)
- **TypeScript**: 15% (21ファイル)

### フレームワーク/ライブラリ
- **React** v^18.0.0 (信頼度: high)
- **Next.js** v^13.0.0 (信頼度: high)

## 🗺️ プロジェクト構造図

```mermaid
subgraph page1 ["📄 pages/index.jsx"]
  subgraph comp1 ["🧩 SideBar"]
    child1["🧩 SearchForm"]
  end
  comp2["🧩 ContactButton"]
end
```

### 🧠 **Intelligent Analysis Report** (LLM強化)

- **AI駆動フレームワーク検出**: OpenAI/Anthropic/Perplexity統合
- **コンポーネントタイプ分類**: 自動カテゴライゼーション
- **使用パターン分析**: アーキテクチャパターン識別
- **詳細ログ付き解析**: トレーサブルなAI判定プロセス
- **信頼度スコア**: AI分析結果の確度評価

### 📊 **Page-Component Analysis Report**

- **ページごとの詳細コンポーネント解析**: 完全な依存関係マッピング
- **使用コンテキスト情報**: import文、props、イベント解析
- **インタラクティブな関係図**: クリック可能なMermaid図表
- **再帰的依存解析**: 子コンポーネントの子コンポーネントまで追跡

## 🛠️ Development

### 💻 **開発コマンド**

```bash
# プロジェクトビルド
npm run build

# 開発モーCLI実行
npm run cli -- analyze ./test-project

# ビルド後CLI実行
npm run cli:build -- analyze ./test-project

# コード品質チェック
npm run lint

# コードフォーマット
npm run format

# TypeScriptコンパイルチェック
tsc --noEmit
```

### 🧪 **デバッグ・テストコマンド**

```bash
# ローカルプロジェクトテスト
npm run cli -- analyze ./examples/vue-project

# GitHubリポジトリテスト
npm run cli -- analyze https://github.com/vuejs/vue-router

# LLM解析テスト (要APIキー)
npm run cli -- analyze ./examples/react-project --format intelligent

# 詳細オプションテスト
npm run cli -- analyze ./project --show-usage-context --group-by-directory
```

## 📁 Project Structure

```text
project-mieru/
├── src/
│   ├── cli/              # CLI インターフェース
│   │   └── index.ts      # メインCLIハンドラー (Commander.js実装)
│   ├── core/             # コア機能
│   │   ├── baseAnalyzer.ts    # 共通解析ロジック
│   │   └── errorHandler.ts    # 統一エラーハンドリング
│   ├── analyzer/         # 解析エンジン (6ファイル)
│   │   ├── astParser.ts        # AST解析 (Babel使用)
│   │   ├── vueSfcParser.ts     # Vue SFC解析 (@vue/compiler-sfc)
│   │   ├── pageAnalyzer.ts     # ページ構造解析
│   │   ├── fileScanner.ts      # ファイルスキャン (glob使用)
│   │   ├── intelligentAnalyzer.ts  # LLMベース解析
│   │   └── techStackAnalyzer.ts    # 技術スタック検出
│   ├── generators/       # 図表生成 (2ファイル)
│   │   ├── mermaidGenerator.ts     # 標準Mermaid図表
│   │   └── intelligentMermaidGenerator.ts # LLM強化図表
│   ├── types/           # TypeScript型定義 (7ファイル)
│   │   ├── index.ts     # 型エクスポート統合
│   │   ├── ast.ts       # AST関連型
│   │   ├── vue.ts       # Vue関連型
│   │   ├── page.ts      # ページ関連型
│   │   ├── mermaid.ts   # Mermaid関連型
│   │   ├── scanner.ts   # スキャン関連型
│   │   └── dependency.ts # 依存関係型
│   ├── utils/           # ユーティリティ (2ファイル)
│   │   ├── llmClient.ts # LLM API統合 (OpenAI/Anthropic/Perplexity)
│   │   └── index.ts     # ユーティリティエクスポート
│   ├── tests/           # テストディレクトリ (未実装)
│   ├── visualizer/      # ビジュアライザー (未実装)
│   ├── cli.ts           # CLIエントリーポイント (shebang付き)
│   └── index.ts         # メインエントリーポイント
└── dist/                # TypeScriptコンパイル出力
```

## 🎯 Development Status

### ✅ **実装完了機能**

- [x] ✅ **プロジェクト設定・CLI基盤** - Commander.js + TypeScript
- [x] ✅ **ファイルスキャン・AST解析** - Babel parser + Glob
- [x] ✅ **Vue SFC解析** - @vue/compiler-sfc統合
- [x] ✅ **React/Next.js解析** - JSX/TSX AST解析
- [x] ✅ **ページ構造解析** - 最大3階層のコンポーネント依存
- [x] ✅ **技術スタック検出** - 自動フレームワーク識別
- [x] ✅ **GitHub統合** - リポジトリURL/ブランチ/サブディレクトリ対応
- [x] ✅ **Mermaid図表生成** - ネストしたsubgraph構造
- [x] ✅ **カラーコード視覚化** - ページ(緑)/コンポーネント(青系)
- [x] ✅ **LLMベースインテリジェント解析** - OpenAI/Anthropic/Perplexity
- [x] ✅ **Markdownレポート生成** - 統計情報付き詳細レポート
- [x] ✅ **自動クリーンアップ** - 一時ディレクトリ管理

### 🚧 **開発中・計画中**

- [ ] 🔧 **テストスイート** - Unit/Integration テスト
- [ ] 🔧 **設定ファイル機能** - mieru.config.js サポート
- [ ] 🔧 **エラーハンドリング強化** - 詳細診断情報
- [ ] 🔧 **パフォーマンス最適化** - 大規模プロジェクト対応
- [ ] 🚧 **HTMLインタラクティブレポート** - Web UI
- [ ] 🚧 **npm パッケージ配布** - グローバルインストール
- [ ] 🚧 **プラグインシステム** - カスタムアナライザー
- [ ] 🚧 **CI/CD統合** - 自動解析ワークフロー

### 📊 **現在のシステム状態**

- **総ファイル数**: 20+ TypeScriptファイル
- **コード行数**: 4,000+ 行
- **成熟度**: 🟡 **Beta/MVP** - コア機能完成、本格運用向け改善が必要
- **依存関係**: 6個の主要依存関係 (Babel, Vue Compiler, Commander等)
- **対応Node.js**: >=18.0.0
- **モジュール形式**: ESM (ES Modules)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- Mermaid.js for diagram generation
- Vue.js compiler for SFC parsing
- Babel for JavaScript/TypeScript AST parsing
- Commander.js for CLI interface
