export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'perplexity';
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}
export interface LLMUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface LLMResponse {
    content: string;
    usage?: LLMUsage;
}
export declare class LLMClient {
    private config;
    constructor(config: LLMConfig);
    chat(prompt: string): Promise<string>;
    chatWithUsage(prompt: string): Promise<LLMResponse>;
    private callOpenAI;
    private callAnthropic;
    private callPerplexity;
}
export declare function createLLMClient(): LLMClient;
//# sourceMappingURL=llmClient.d.ts.map