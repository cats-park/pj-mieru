export class ProjectMieruError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'ProjectMieruError';
    }
}
export class ConfigError extends ProjectMieruError {
    constructor(message, details) {
        super(message, 'CONFIG_ERROR', details);
    }
}
export class AnalysisError extends ProjectMieruError {
    constructor(message, details) {
        super(message, 'ANALYSIS_ERROR', details);
    }
}
export class LLMError extends ProjectMieruError {
    constructor(message, details) {
        super(message, 'LLM_ERROR', details);
    }
}
export class ErrorHandler {
    static handleError(error) {
        if (error instanceof ProjectMieruError) {
            console.error(`❌ ${error.name}: ${error.message}`);
            if (error instanceof LLMError) {
                console.error('🔑 LLM APIキーが設定されていません。');
                console.error('💡 以下のいずれかのAPIキーを .env ファイルに設定してください:');
                console.error('   - OPENAI_API_KEY (OpenAI)');
                console.error('   - ANTHROPIC_API_KEY (Anthropic Claude)');
                console.error('   - PERPLEXITY_API_KEY (Perplexity)');
            }
            if (error.details) {
                console.error('詳細:', error.details);
            }
        }
        else if (error instanceof Error) {
            console.error(`❌ エラー: ${error.message}`);
        }
        else {
            console.error('❌ 不明なエラーが発生しました:', error);
        }
        process.exit(1);
    }
    static createLLMError() {
        return new LLMError('No LLM API key found');
    }
    static createAnalysisError(message, details) {
        return new AnalysisError(message, details);
    }
    static createConfigError(message, details) {
        return new ConfigError(message, details);
    }
}
//# sourceMappingURL=errorHandler.js.map