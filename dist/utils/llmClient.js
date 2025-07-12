// Load environment variables from .env file if exists
import { config } from 'dotenv';
import path from 'path';
// Initialize dotenv configuration
try {
    // Load .env file from project root
    const envPath = path.resolve(process.cwd(), '.env');
    config({ path: envPath });
    // Debug: Log if API key is loaded
    if (process.env.OPENAI_API_KEY) {
        console.log('✅ OpenAI API key loaded successfully');
    }
    else if (process.env.ANTHROPIC_API_KEY) {
        console.log('✅ Anthropic API key loaded successfully');
    }
    else if (process.env.PERPLEXITY_API_KEY) {
        console.log('✅ Perplexity API key loaded successfully');
    }
    else {
        console.log('⚠️ No API keys found in environment');
    }
}
catch (error) {
    console.log('⚠️ Failed to load dotenv:', error);
}
export class LLMClient {
    config;
    constructor(config) {
        this.config = config;
    }
    async chat(prompt) {
        switch (this.config.provider) {
            case 'openai':
                return this.callOpenAI(prompt);
            case 'anthropic':
                return this.callAnthropic(prompt);
            case 'perplexity':
                return this.callPerplexity(prompt);
            default:
                throw new Error(`Unsupported LLM provider: ${this.config.provider}`);
        }
    }
    async callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: this.config.maxTokens || 4000,
                temperature: this.config.temperature || 0.1,
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        return data.choices[0].message.content;
    }
    async callAnthropic(prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: this.config.model,
                max_tokens: this.config.maxTokens || 4000,
                temperature: this.config.temperature || 0.1,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });
        if (!response.ok) {
            throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        return data.content[0].text;
    }
    async callPerplexity(prompt) {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.apiKey}`,
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                max_tokens: this.config.maxTokens || 4000,
                temperature: this.config.temperature || 0.1,
            }),
        });
        if (!response.ok) {
            throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
        }
        const data = (await response.json());
        return data.choices[0].message.content;
    }
}
export function createLLMClient() {
    // Try to determine which LLM service to use based on available API keys
    if (process.env.OPENAI_API_KEY) {
        return new LLMClient({
            provider: 'openai',
            apiKey: process.env.OPENAI_API_KEY,
            model: process.env.OPENAI_MODEL || 'gpt-4',
            maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
        });
    }
    if (process.env.ANTHROPIC_API_KEY) {
        return new LLMClient({
            provider: 'anthropic',
            apiKey: process.env.ANTHROPIC_API_KEY,
            model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
            maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
        });
    }
    if (process.env.PERPLEXITY_API_KEY) {
        return new LLMClient({
            provider: 'perplexity',
            apiKey: process.env.PERPLEXITY_API_KEY,
            model: process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-large-128k-online',
            maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000'),
            temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
        });
    }
    throw new Error('No LLM API key found. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or PERPLEXITY_API_KEY in your environment variables.');
}
//# sourceMappingURL=llmClient.js.map