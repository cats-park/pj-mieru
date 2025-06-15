export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'perplexity';
    apiKey: string;
    model: string;
    maxTokens?: number;
    temperature?: number;
}
export declare class LLMClient {
    private config;
    constructor(config: LLMConfig);
    chat(prompt: string): Promise<string>;
    private callOpenAI;
    private callAnthropic;
    private callPerplexity;
}
export declare function createLLMClient(): LLMClient;
//# sourceMappingURL=llmClient.d.ts.map