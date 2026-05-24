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

  detectDesignPatterns(code: string): Array<{ pattern: string; location: string; confidence: number }> {
    const patterns: Array<{ pattern: string; location: string; confidence: number }> = [];

    if (code.match(/class\s+\w+Factory/i)) {
      patterns.push({
        pattern: 'Factory Pattern (工廠模式)',
        location: '類定義',
        confidence: 95,
      });
    }

    const singletonPattern = code.match(/private\s+static\s+\w+\s+instance|getInstance\s*\(\)/gi);
    if (singletonPattern && singletonPattern.length >= 2) {
      patterns.push({
        pattern: 'Singleton Pattern (單例模式)',
        location: 'getInstance 方法',
        confidence: 98,
      });
    }

    if (code.match(/class\s+\w+Adapter|implements\s+\w+Interface/gi)) {
      patterns.push({
        pattern: 'Adapter Pattern (適配器模式)',
        location: '類實現',
        confidence: 85,
      });
    }

    const observerPattern = code.match(/addEventListener|on\(|emit\(|subscribe|Observer/gi);
    if (observerPattern && observerPattern.length >= 2) {
      patterns.push({
        pattern: 'Observer Pattern (觀察者模式)',
        location: '事件系統',
        confidence: 90,
      });
    }

    if (code.match(/class\s+\w+Strategy|setStrategy|strategy\./gi)) {
      patterns.push({
        pattern: 'Strategy Pattern (策略模式)',
        location: '策略切換邏輯',
        confidence: 92,
      });
    }

    if (code.match(/class\s+\w+Decorator|@\w+\(|wraps\(/gi)) {
      patterns.push({
        pattern: 'Decorator Pattern (裝飾器模式)',
        location: '裝飾器定義',
        confidence: 88,
      });
    }

    if (code.match(/class\s+\w+Facade|facade\./gi)) {
      patterns.push({
        pattern: 'Facade Pattern (外觀模式)',
        location: 'Facade 類',
        confidence: 80,
      });
    }

    const builderPattern = code.match(/\.with\w+\(|\.set\w+\(.*return\s+this|builder/gi);
    if (builderPattern && builderPattern.length >= 3) {
      patterns.push({
        pattern: 'Builder Pattern (建造者模式)',
        location: '鏈式調用',
        confidence: 87,
      });
    }

    if (code.match(/class\s+\w+Proxy|new\s+Proxy\(/gi)) {
      patterns.push({
        pattern: 'Proxy Pattern (代理模式)',
        location: 'Proxy 實現',
        confidence: 93,
      });
    }

    if (code.match(/command\s*=|execute\(|undo\(|redo\(/gi)) {
      patterns.push({
        pattern: 'Command Pattern (命令模式)',
        location: '命令執行邏輯',
        confidence: 85,
      });
    }

    return patterns;
  }

  async applyDesignPattern(code: string, patternName: string): Promise<string> {
    logger.info(`🎨 應用設計模式：${patternName}...`);

    const patterns: Record<string, string> = {
      singleton: `
// Singleton Pattern Implementation
class Singleton {
  private static instance: Singleton;
  private constructor() {}
  
  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }
}`,
      factory: `
// Factory Pattern Implementation  
interface Product {
  operation(): string;
}

class ConcreteProductA implements Product {
  operation(): string { return 'Product A'; }
}

class ConcreteProductB implements Product {
  operation(): string { return 'Product B'; }
}

class Factory {
  static createProduct(type: string): Product {
    switch(type) {
      case 'A': return new ConcreteProductA();
      case 'B': return new ConcreteProductB();
      default: throw new Error('Unknown product type');
    }
  }
}`,
      strategy: `
// Strategy Pattern Implementation
interface Strategy {
  execute(data: any): any;
}

class ConcreteStrategyA implements Strategy {
  execute(data: any): any { return data * 2; }
}

class ConcreteStrategyB implements Strategy {
  execute(data: any): any { return data * 3; }
}

class Context {
  private strategy: Strategy;
  
  setStrategy(strategy: Strategy): void {
    this.strategy = strategy;
  }
  
  executeStrategy(data: any): any {
    return this.strategy.execute(data);
  }
}`,
      observer: `
// Observer Pattern Implementation
interface Observer {
  update(data: any): void;
}

class Subject {
  private observers: Observer[] = [];
  
  attach(observer: Observer): void {
    this.observers.push(observer);
  }
  
  detach(observer: Observer): void {
    const index = this.observers.indexOf(observer);
    if (index > -1) this.observers.splice(index, 1);
  }
  
  notify(data: any): void {
    for (const observer of this.observers) {
      observer.update(data);
    }
  }
}`,
      builder: `
// Builder Pattern Implementation
class Product {
  parts: string[] = [];
}

interface Builder {
  reset(): void;
  buildPartA(): Builder;
  buildPartB(): Builder;
  buildPartC(): Builder;
  getResult(): Product;
}

class ConcreteBuilder implements Builder {
  private product: Product;
  
  constructor() { this.reset(); }
  
  reset(): void { this.product = new Product(); }
  
  buildPartA(): Builder {
    this.product.parts.push('PartA');
    return this;
  }
  
  buildPartB(): Builder {
    this.product.parts.push('PartB');
    return this;
  }
  
  buildPartC(): Builder {
    this.product.parts.push('PartC');
    return this;
  }
  
  getResult(): Product {
    const result = this.product;
    this.reset();
    return result;
  }
}`,
    };

    return patterns[patternName.toLowerCase()] || `設計模式 "${patternName}" 尚未實現`;
  }

  calculateComplexityMetrics(code: string): {
    cyclomaticComplexity: number;
    cognitiveComplexity: number;
    linesOfCode: number;
    maintainabilityIndex: number;
  } {
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const linesOfCode = lines.length;

    const branches = (code.match(/if\s*\(|else|case\s+|catch\s*\(|&&|\|\|/g) || []).length;
    const loops = (code.match(/for\s*\(|while\s*\(|do\s+\{/g) || []).length;
    const functions = (code.match(/function\s+\w+|=>\s*\{|^\s*\w+\s*\(/gm) || []).length;
    
    const cyclomaticComplexity = branches + loops + functions + 1;

    const nestedDepth = this.calculateMaxNestingDepth(code);
    const cognitiveComplexity = branches * 1.5 + loops * 2 + nestedDepth * 3;

    const averageLineLength = code.split('\n').reduce((sum, line) => sum + line.length, 0) / lines.length;
    const commentRatio = (code.match(/\/\/|\/\*|\*\//g) || []).length / lines.length;
    
    const maintainabilityIndex = Math.max(
      0,
      100 - cyclomaticComplexity * 2 - linesOfCode / 10 - nestedDepth * 5 + commentRatio * 10
    );

    return {
      cyclomaticComplexity,
      cognitiveComplexity: Math.round(cognitiveComplexity),
      linesOfCode,
      maintainabilityIndex: Math.round(maintainabilityIndex),
    };
  }

  private calculateMaxNestingDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    for (let i = 0; i < code.length; i++) {
      if (code[i] === '{') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (code[i] === '}') {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }
}

export default FusionCoder;
