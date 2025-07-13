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
  } else if (process.env.ANTHROPIC_API_KEY) {
    console.log('✅ Anthropic API key loaded successfully');
  } else if (process.env.PERPLEXITY_API_KEY) {
    console.log('✅ Perplexity API key loaded successfully');
  } else {
    console.log('⚠️ No API keys found in environment');
  }
} catch (error) {
  console.log('⚠️ Failed to load dotenv:', error);
}

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

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AnthropicResponse {
  content: Array<{
    text: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async chat(prompt: string): Promise<string> {
    const response = await this.chatWithUsage(prompt);
    return response.content;
  }

  async chatWithUsage(prompt: string): Promise<LLMResponse> {
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

  private async callOpenAI(prompt: string): Promise<LLMResponse> {
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
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as OpenAIResponse;
    return {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined
    };
  }

  private async callAnthropic(prompt: string): Promise<LLMResponse> {
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
      throw new Error(
        `Anthropic API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as AnthropicResponse;
    return {
      content: data.content[0].text,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined
    };
  }

  private async callPerplexity(prompt: string): Promise<LLMResponse> {
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
      throw new Error(
        `Perplexity API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as PerplexityResponse;
    return {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined
    };
  }
}

export function createLLMClient(apiKey?: string): LLMClient {
  // APIキーの優先順位: 引数 > 環境変数
  const effectiveApiKey = apiKey || process.env.MIERU_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  
  if (effectiveApiKey) {
    return new LLMClient({
      provider: 'openai',
      apiKey: effectiveApiKey,
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
      model:
        process.env.PERPLEXITY_MODEL || 'llama-3.1-sonar-large-128k-online',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.1'),
    });
  }

  throw new Error(
    'No LLM API key found. Please set OPENAI_API_KEY, ANTHROPIC_API_KEY, or PERPLEXITY_API_KEY in your environment variables.'
  );
}
