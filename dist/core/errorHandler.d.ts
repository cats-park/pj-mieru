export declare class ProjectMieruError extends Error {
    code: string;
    details?: any | undefined;
    constructor(message: string, code: string, details?: any | undefined);
}
export declare class ConfigError extends ProjectMieruError {
    constructor(message: string, details?: any);
}
export declare class AnalysisError extends ProjectMieruError {
    constructor(message: string, details?: any);
}
export declare class LLMError extends ProjectMieruError {
    constructor(message: string, details?: any);
}
export declare class ErrorHandler {
    static handleError(error: unknown): void;
    static createLLMError(): LLMError;
    static createAnalysisError(message: string, details?: any): AnalysisError;
    static createConfigError(message: string, details?: any): ConfigError;
}
//# sourceMappingURL=errorHandler.d.ts.map