import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from './logger';

export interface AIProvider {
  name: string;
  generate(prompt: string, options?: GenerationOptions): Promise<string>;
  stream?(prompt: string, options?: GenerationOptions): AsyncGenerator<string>;
}

export interface GenerationOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  model?: string;
}

export class ClaudeProvider implements AIProvider {
  name = 'Claude';
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error) {
      logger.error('Claude API 調用失敗：', error);
      throw error;
    }
  }

  async *stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string> {
    try {
      const stream = await this.client.messages.create({
        model: options?.model || 'claude-3-5-sonnet-20241022',
        max_tokens: options?.maxTokens || 4096,
        temperature: options?.temperature,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          yield event.delta.text;
        }
      }
    } catch (error) {
      logger.error('Claude 流式調用失敗：', error);
      throw error;
    }
  }
}

export class GPTProvider implements AIProvider {
  name = 'GPT';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: options?.model || 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: options?.maxTokens || 4096,
          temperature: options?.temperature || 0.7,
          top_p: options?.topP || 1,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      logger.error('GPT API 調用失敗：', error);
      throw error;
    }
  }
}

export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider: string = 'claude';

  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
    logger.info(`✅ 註冊 AI Provider: ${provider.name}`);
  }

  setActiveProvider(name: string): void {
    if (!this.providers.has(name.toLowerCase())) {
      throw new Error(`Provider ${name} 未註冊`);
    }
    this.activeProvider = name.toLowerCase();
    logger.info(`🔄 切換到 ${name} Provider`);
  }

  async generate(prompt: string, options?: GenerationOptions): Promise<string> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider) {
      throw new Error(`Provider ${this.activeProvider} 不可用`);
    }

    return await provider.generate(prompt, options);
  }

  async *stream(prompt: string, options?: GenerationOptions): AsyncGenerator<string> {
    const provider = this.providers.get(this.activeProvider);
    if (!provider || !provider.stream) {
      throw new Error(`Provider ${this.activeProvider} 不支持流式輸出`);
    }

    yield* provider.stream(prompt, options);
  }

  async tryMultipleProviders(prompt: string, options?: GenerationOptions): Promise<string> {
    const providerNames = Array.from(this.providers.keys());
    
    for (const name of providerNames) {
      try {
        const provider = this.providers.get(name)!;
        logger.info(`嘗試使用 ${provider.name}...`);
        return await provider.generate(prompt, options);
      } catch (error) {
        logger.warn(`${name} 失敗，嘗試下一個 Provider`);
        continue;
      }
    }

    throw new Error('所有 AI Providers 都不可用');
  }
}

export default AIProviderManager;
