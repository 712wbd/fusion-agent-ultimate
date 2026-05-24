import { logger } from '@utils/logger';
import { Anthropic } from '@anthropic-ai/sdk';

interface CodeGenerationOptions {
  language: string;
  framework?: string;
  style?: 'functional' | 'oop' | 'procedural';
  includeTests?: boolean;
  includeComments?: boolean;
}

export class FusionCoder {
  private anthropic: Anthropic | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  async generateCode(description: string, options: CodeGenerationOptions): Promise<string> {
    logger.info(`💻 Fusion Coder 生成代碼：${description.substring(0, 50)}...`);

    const prompt = this.buildPrompt(description, options);

    if (!this.anthropic) {
      return this.generateMockCode(description, options);
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return this.extractCode(content.text);
      }

      return '';
    } catch (error) {
      logger.error('代碼生成失敗：', error);
      return this.generateMockCode(description, options);
    }
  }

  private buildPrompt(description: string, options: CodeGenerationOptions): string {
    const { language, framework, style, includeTests, includeComments } = options;

    return `
你是世界頂級的 ${language} 開發專家。請根據以下需求生成高質量、生產級別的代碼。

## 需求描述
${description}

## 技術要求
- 語言：${language}
${framework ? `- 框架：${framework}` : ''}
- 編程範式：${style || 'functional'}
- 代碼風格：Clean Code、SOLID 原則
- 性能優化：時間複雜度最優化
${includeTests ? '- 包含單元測試（覆蓋率 > 80%）' : ''}
${includeComments ? '- 包含清晰的註釋' : '- 代碼應自解釋，最小化註釋'}

## 設計模式建議
根據需求自動應用合適的設計模式（工廠、單例、策略、觀察者等）

## 錯誤處理
實現完善的錯誤處理和邊界條件檢查

## 代碼質量標準
- 命名規範：語義化、清晰
- 函數職責：單一職責原則
- 代碼複用：DRY 原則
- 類型安全：完整的類型註解（如適用）

請生成完整的、可直接運行的代碼。
    `;
  }

  private extractCode(text: string): string {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
    const matches = [...text.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      return matches.map(m => m[1]).join('\n\n');
    }

    return text;
  }

  private generateMockCode(description: string, options: CodeGenerationOptions): string {
    const { language } = options;

    if (language === 'typescript' || language === 'javascript') {
      return `
// 自動生成的代碼：${description}

interface DataProcessor<T> {
  process(data: T): Promise<T>;
  validate(data: T): boolean;
}

class SmartProcessor<T> implements DataProcessor<T> {
  private cache: Map<string, T> = new Map();
  private retryCount: number = 3;

  async process(data: T): Promise<T> {
    const cacheKey = JSON.stringify(data);
    
    if (this.cache.has(cacheKey)) {
      console.log('從緩存返回');
      return this.cache.get(cacheKey)!;
    }

    for (let attempt = 0; attempt < this.retryCount; attempt++) {
      try {
        if (!this.validate(data)) {
          throw new Error('數據驗證失敗');
        }

        const result = await this.executeProcessing(data);
        this.cache.set(cacheKey, result);
        
        return result;
      } catch (error) {
        if (attempt === this.retryCount - 1) {
          throw error;
        }
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error('處理失敗');
  }

  validate(data: T): boolean {
    return data !== null && data !== undefined;
  }

  private async executeProcessing(data: T): Promise<T> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 100);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default SmartProcessor;
      `;
    }

    if (language === 'python') {
      return `
# 自動生成的代碼：${description}

from typing import TypeVar, Generic, Optional, Dict
from abc import ABC, abstractmethod
import asyncio
import json

T = TypeVar('T')

class DataProcessor(ABC, Generic[T]):
    @abstractmethod
    async def process(self, data: T) -> T:
        pass
    
    @abstractmethod
    def validate(self, data: T) -> bool:
        pass

class SmartProcessor(DataProcessor[T]):
    def __init__(self, retry_count: int = 3):
        self.cache: Dict[str, T] = {}
        self.retry_count = retry_count
    
    async def process(self, data: T) -> T:
        cache_key = json.dumps(data, default=str)
        
        if cache_key in self.cache:
            print("從緩存返回")
            return self.cache[cache_key]
        
        for attempt in range(self.retry_count):
            try:
                if not self.validate(data):
                    raise ValueError("數據驗證失敗")
                
                result = await self._execute_processing(data)
                self.cache[cache_key] = result
                
                return result
            except Exception as e:
                if attempt == self.retry_count - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
        
        raise RuntimeError("處理失敗")
    
    def validate(self, data: T) -> bool:
        return data is not None
    
    async def _execute_processing(self, data: T) -> T:
        await asyncio.sleep(0.1)
        return data
      `;
    }

    return `// 代碼生成中，請稍候...`;
  }

  async refactorCode(code: string, language: string): Promise<string> {
    logger.info('♻️ Fusion Coder 重構代碼...');

    const prompt = `
作為重構專家，請重構以下 ${language} 代碼：

\`\`\`${language}
${code}
\`\`\`

重構目標：
1. 應用設計模式（如適用）
2. 消除代碼異味
3. 拆分過長函數（>50 行）
4. 改進命名
5. 優化性能
6. 增強可讀性和可維護性

保持功能不變，返回重構後的代碼。
    `;

    if (!this.anthropic) {
      return code;
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return this.extractCode(content.text);
      }

      return code;
    } catch (error) {
      logger.error('重構失敗：', error);
      return code;
    }
  }

  async explainCode(code: string, language: string): Promise<string> {
    logger.info('📖 Fusion Coder 解釋代碼...');

    const prompt = `
請詳細解釋以下 ${language} 代碼的工作原理：

\`\`\`${language}
${code}
\`\`\`

請包括：
1. 代碼功能概述
2. 關鍵邏輯解釋
3. 設計模式識別
4. 性能分析
5. 潛在問題
6. 改進建議
    `;

    if (!this.anthropic) {
      return '代碼解釋功能需要 API Key';
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      return '';
    } catch (error) {
      logger.error('代碼解釋失敗：', error);
      return '解釋失敗';
    }
  }
}

export default FusionCoder;
