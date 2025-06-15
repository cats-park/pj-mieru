export class ProjectMieruError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProjectMieruError';
  }
}

export class ConfigError extends ProjectMieruError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
  }
}

export class AnalysisError extends ProjectMieruError {
  constructor(message: string, details?: any) {
    super(message, 'ANALYSIS_ERROR', details);
  }
}

export class LLMError extends ProjectMieruError {
  constructor(message: string, details?: any) {
    super(message, 'LLM_ERROR', details);
  }
}

export class ErrorHandler {
  static handleError(error: unknown): void {
    if (error instanceof ProjectMieruError) {
      console.error(`❌ ${error.name}: ${error.message}`);

      if (error instanceof LLMError) {
        console.error('🔑 LLM APIキーが設定されていません。');
        console.error(
          '💡 以下のいずれかのAPIキーを .env ファイルに設定してください:'
        );
        console.error('   - OPENAI_API_KEY (OpenAI)');
        console.error('   - ANTHROPIC_API_KEY (Anthropic Claude)');
        console.error('   - PERPLEXITY_API_KEY (Perplexity)');
      }

      if (error.details) {
        console.error('詳細:', error.details);
      }
    } else if (error instanceof Error) {
      console.error(`❌ エラー: ${error.message}`);
    } else {
      console.error('❌ 不明なエラーが発生しました:', error);
    }

    process.exit(1);
  }

  static createLLMError(): LLMError {
    return new LLMError('No LLM API key found');
  }

  static createAnalysisError(message: string, details?: any): AnalysisError {
    return new AnalysisError(message, details);
  }

  static createConfigError(message: string, details?: any): ConfigError {
    return new ConfigError(message, details);
  }
}
