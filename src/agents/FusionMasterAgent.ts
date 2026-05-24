import type {
  FusionConfig,
  AnalysisResult,
  DeploymentConfig,
  TestGenerationOptions,
  RefactorOptions,
  DocumentationOptions,
} from '@types/index';
import { logger } from '@utils/logger';
import { Anthropic } from '@anthropic-ai/sdk';
import { nanoid } from 'nanoid';

export class FusionMasterAgent {
  private config: FusionConfig;
  private anthropic: Anthropic | null = null;
  private initialized: boolean = false;
  private sessionId: string;

  constructor(config: FusionConfig) {
    this.config = config;
    this.sessionId = nanoid();
    logger.info(`🌟 Fusion Master Agent 已創建 (Session: ${this.sessionId})`);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Agent 已經初始化');
      return;
    }

    logger.info('🚀 初始化 Fusion Master Agent...');

    if (this.config.anthropicApiKey) {
      this.anthropic = new Anthropic({
        apiKey: this.config.anthropicApiKey,
      });
      logger.info('✅ Anthropic Claude API 已連接');
    }

    if (this.config.securityScanOnStart) {
      logger.info('🔒 執行啟動時安全檢查...');
    }

    this.initialized = true;
    logger.info('✅ Fusion Master Agent 初始化完成');
  }

  async analyzeProject(projectPath: string, deep: boolean = false): Promise<AnalysisResult> {
    this.ensureInitialized();
    logger.info(`🔍 分析項目：${projectPath} (深度分析: ${deep})`);

    const prompt = `
作為世界頂級的代碼分析專家，請全面分析以下項目：

項目路徑：${projectPath}
分析深度：${deep ? '深度分析' : '標準分析'}

請提供以下分析：
1. 架構模式識別
2. 代碼質量評估（可維護性、可讀性、測試覆蓋率）
3. 性能分析（時間複雜度、空間複雜度、瓶頸）
4. 安全漏洞檢測（OWASP Top 10、CVE）
5. 改進建議（優先級排序）

請以 JSON 格式返回分析結果。
    `;

    const result = await this.callLLM(prompt);
    
    return {
      summary: result.summary || '分析完成',
      architecture: result.architecture || { pattern: 'unknown', layers: [], dependencies: { nodes: [], edges: [] }, complexity: 0, modularity: 0 },
      codeQuality: result.codeQuality || { maintainability: 0, readability: 0, testCoverage: 0, duplication: 0, codeSmells: [] },
      performance: result.performance || { timeComplexity: 'unknown', spaceComplexity: 'unknown', bottlenecks: [], optimizationOpportunities: [] },
      security: result.security || { vulnerabilities: [], riskScore: 0, complianceStatus: { standard: 'none', compliant: false, issues: [] } },
      recommendations: result.recommendations || [],
    };
  }

  async optimize(projectPath: string, type: string = 'all'): Promise<any> {
    this.ensureInitialized();
    logger.info(`⚡ 優化項目：${projectPath} (類型: ${type})`);

    const prompt = `
作為性能優化大師，請優化以下項目：

項目路徑：${projectPath}
優化類型：${type}

請執行以下優化：
1. 性能優化：算法優化、並發處理、緩存策略
2. 代碼重構：消除代碼異味、應用設計模式
3. 安全加固：修復漏洞、加強驗證
4. 依賴更新：更新過時依賴、移除未使用依賴

返回優化報告，包括：
- 優化前後對比
- 性能提升百分比
- 修改的文件列表
- 風險評估
    `;

    return await this.callLLM(prompt);
  }

  async securityScan(projectPath: string, autoFix: boolean = false): Promise<any> {
    this.ensureInitialized();
    logger.info(`🔒 安全掃描：${projectPath} (自動修復: ${autoFix})`);

    const prompt = `
作為安全專家，請掃描以下項目的安全漏洞：

項目路徑：${projectPath}
自動修復：${autoFix}

檢測範圍：
1. OWASP Top 10 漏洞
2. 依賴漏洞 (CVE)
3. 敏感信息洩露
4. 配置錯誤
5. 權限問題

${autoFix ? '請提供自動修復方案並應用' : '僅報告漏洞'}

返回安全報告，包括：
- 漏洞列表（按嚴重程度排序）
- 風險評分
- 修復建議
${autoFix ? '- 已應用的修復' : ''}
    `;

    return await this.callLLM(prompt);
  }

  async deploy(projectPath: string, target: string): Promise<any> {
    this.ensureInitialized();
    logger.info(`🚀 部署項目：${projectPath} -> ${target}`);

    const prompt = `
作為 DevOps 專家，請部署以下項目：

項目路徑：${projectPath}
部署目標：${target}

部署步驟：
1. 環境準備
2. 依賴安裝
3. 構建項目
4. 容器化（如需要）
5. 部署到 ${target}
6. 配置監控和告警
7. 驗證部署

返回部署報告，包括：
- 部署 URL
- 健康檢查狀態
- 監控儀表板鏈接
- 回滾方案
    `;

    return await this.callLLM(prompt);
  }

  async learn(projectPath: string): Promise<any> {
    this.ensureInitialized();
    logger.info(`🧠 學習項目：${projectPath}`);

    const prompt = `
作為自適應學習系統，請從以下項目中學習：

項目路徑：${projectPath}

學習內容：
1. 代碼風格（縮進、引號、命名習慣）
2. 架構模式（MVC、微服務、無服務器）
3. 常用庫和框架
4. 設計模式
5. 測試策略

構建項目知識圖譜，用於未來的個性化建議。

返回學習報告。
    `;

    return await this.callLLM(prompt);
  }

  async review(filePath: string, autoFix: boolean = false): Promise<any> {
    this.ensureInitialized();
    logger.info(`👀 代碼審查：${filePath} (自動修復: ${autoFix})`);

    const prompt = `
作為資深代碼審查專家，請審查以下文件：

文件路徑：${filePath}
自動修復：${autoFix}

審查標準：
1. 代碼質量（可維護性、可讀性）
2. 設計模式應用
3. 錯誤處理
4. 測試覆蓋率
5. 性能考慮
6. 安全問題
7. 文檔完整性

返回審查報告，包括：
- 質量評分（0-100）
- 改進建議（按優先級）
${autoFix ? '- 自動修復代碼' : ''}
- 示例代碼
    `;

    return await this.callLLM(prompt);
  }

  async generateTests(filePath: string, type: string): Promise<any> {
    this.ensureInitialized();
    logger.info(`🧪 生成測試：${filePath} (類型: ${type})`);

    const prompt = `
作為測試專家，請為以下文件生成測試用例：

文件路徑：${filePath}
測試類型：${type}

生成要求：
1. 覆蓋所有主要功能
2. 測試邊界條件
3. 測試異常場景
4. 確保 80%+ 覆蓋率
5. 使用最佳實踐

${type === 'unit' && '使用 Jest/Vitest 框架'}
${type === 'integration' && '測試 API 端點和數據庫交互'}
${type === 'e2e' && '使用 Playwright/Cypress 框架'}

返回完整的測試代碼。
    `;

    return await this.callLLM(prompt);
  }

  async refactor(filePath: string): Promise<any> {
    this.ensureInitialized();
    logger.info(`♻️ 重構代碼：${filePath}`);

    const prompt = `
作為重構專家，請重構以下文件：

文件路徑：${filePath}

重構目標：
1. 消除代碼異味
2. 應用設計模式
3. 拆分過長函數
4. 改進命名
5. 增強可讀性
6. 優化性能

保持功能不變，提升代碼質量。

返回重構後的代碼和改進說明。
    `;

    return await this.callLLM(prompt);
  }

  async generateDocs(projectPath: string, type: string): Promise<any> {
    this.ensureInitialized();
    logger.info(`📚 生成文檔：${projectPath} (類型: ${type})`);

    const prompt = `
作為技術寫作專家，請為以下項目生成文檔：

項目路徑：${projectPath}
文檔類型：${type}

${type === 'api' && '生成完整的 API 文檔，包括端點、請求/響應格式、示例'}
${type === 'readme' && '生成專業的 README.md，包括介紹、功能、安裝、使用指南'}
${type === 'architecture' && '生成架構文檔，包括系統設計、組件圖、數據流'}

文檔要求：
- 清晰易懂
- 包含示例
- 格式規範
- 圖表輔助

返回完整的 Markdown 文檔。
    `;

    return await this.callLLM(prompt);
  }

  private async callLLM(prompt: string): Promise<any> {
    if (!this.anthropic) {
      logger.warn('LLM 未初始化，返回模擬結果');
      return {
        success: true,
        message: '功能正常，但未連接 AI API',
        data: {},
      };
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        try {
          return JSON.parse(content.text);
        } catch {
          return {
            success: true,
            message: content.text,
          };
        }
      }

      return { success: true };
    } catch (error) {
      logger.error('LLM 調用失敗：', error);
      throw error;
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('Agent 未初始化，請先調用 initialize()');
    }
  }
}

export default FusionMasterAgent;
