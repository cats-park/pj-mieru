import fs from 'fs';
import path from 'path';
import os from 'os';
import { createInterface } from 'readline';

export interface MieruConfig {
  openaiApiKey?: string;
  defaultFramework?: string;
  maxDepth?: number;
  ignorePatterns?: string[];
  includeExternalLibraries?: boolean;
}

export class ConfigManager {
  private static configPath = path.join(os.homedir(), '.mierurc.json');

  static async getApiKey(cliApiKey?: string): Promise<string> {
    // 1. CLI引数が最優先
    if (cliApiKey) {
      return cliApiKey;
    }

    // 2. 環境変数をチェック
    const envApiKey = process.env.MIERU_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (envApiKey) {
      return envApiKey;
    }

    // 3. 設定ファイルをチェック
    const config = await this.loadConfig();
    if (config.openaiApiKey) {
      return config.openaiApiKey;
    }

    // 4. APIキーが見つからない場合
    throw new Error(`
❌ OpenAI APIキーが見つかりません。

以下のいずれかの方法でAPIキーを設定してください：

1. セットアップコマンドを実行:
   $ mieru setup

2. 環境変数を設定:
   $ export OPENAI_API_KEY=sk-your-api-key

3. CLI引数で指定:
   $ mieru analyze ./project --api-key sk-your-api-key

OpenAI APIキーの取得方法: https://platform.openai.com/api-keys
    `);
  }

  static async loadConfig(): Promise<MieruConfig> {
    try {
      if (fs.existsSync(this.configPath)) {
        const configData = await fs.promises.readFile(this.configPath, 'utf-8');
        return JSON.parse(configData);
      }
    } catch (error) {
      console.warn('⚠️ 設定ファイルの読み込みに失敗しました:', error);
    }
    return {};
  }

  static async saveConfig(config: MieruConfig): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.configPath, 
        JSON.stringify(config, null, 2),
        { mode: 0o600 } // ファイルパーミッションを制限
      );
      console.log(`✅ 設定を保存しました: ${this.configPath}`);
    } catch (error) {
      throw new Error(`設定ファイルの保存に失敗しました: ${error}`);
    }
  }

  static async setupInteractive(): Promise<void> {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (text: string): Promise<string> => {
      return new Promise((resolve) => {
        rl.question(text, resolve);
      });
    };

    try {
      console.log('🔧 mieru セットアップを開始します...\n');

      const apiKey = await question('OpenAI APIキーを入力してください: ');
      if (!apiKey.startsWith('sk-')) {
        console.log('⚠️ 無効なAPIキー形式です。sk- で始まる必要があります。');
        process.exit(1);
      }

      const maxDepth = await question('最大解析深度を設定してください (デフォルト: 5): ');
      const includeExternal = await question('外部ライブラリを含めますか？ (y/n, デフォルト: y): ');

      const config: MieruConfig = {
        openaiApiKey: apiKey,
        maxDepth: maxDepth ? parseInt(maxDepth) : 5,
        includeExternalLibraries: includeExternal.toLowerCase() !== 'n',
        ignorePatterns: ['node_modules', '.git', 'dist', 'build']
      };

      await this.saveConfig(config);
      console.log('\n🎉 セットアップが完了しました！');
      console.log('\n使用方法:');
      console.log('  mieru analyze ./my-project');
      console.log('  mieru analyze https://github.com/user/repo');
    } catch (error) {
      console.error('❌ セットアップに失敗しました:', error);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  static async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      // 簡単なバリデーション（実際のAPI呼び出しはしない）
      return apiKey.startsWith('sk-') && apiKey.length > 20;
    } catch {
      return false;
    }
  }
} 