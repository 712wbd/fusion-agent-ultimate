import type { ArchitectureAnalysis, DependencyGraph } from '@types/index';
import { logger } from '@utils/logger';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

export class FusionArchitect {
  private projectPath: string;
  private architecturePatterns: Map<string, number> = new Map();
  
  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async analyzeArchitecture(): Promise<ArchitectureAnalysis> {
    logger.info('🏗️ Fusion Architect 開始分析架構...');
    
    const layers = await this.detectLayers();
    const dependencies = await this.analyzeDependencies();
    const pattern = this.detectArchitecturePattern(layers, dependencies);
    const complexity = this.calculateComplexity(dependencies);
    const modularity = this.calculateModularity(dependencies);

    logger.info(`✅ 架構分析完成：模式 = ${pattern}, 複雜度 = ${complexity.toFixed(2)}`);

    return {
      pattern,
      layers,
      dependencies,
      complexity,
      modularity,
    };
  }

  private async detectLayers(): Promise<string[]> {
    const layers: Set<string> = new Set();
    const layerKeywords = {
      presentation: ['view', 'component', 'page', 'ui', 'screen'],
      business: ['service', 'manager', 'handler', 'processor', 'logic'],
      data: ['repository', 'dao', 'model', 'entity', 'schema'],
      infrastructure: ['config', 'util', 'helper', 'middleware', 'adapter'],
    };

    const scanDir = (dirPath: string) => {
      try {
        const entries = readdirSync(dirPath);
        
        for (const entry of entries) {
          const fullPath = join(dirPath, entry);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            if (entry === 'node_modules' || entry === '.git') continue;
            
            const lowerEntry = entry.toLowerCase();
            for (const [layer, keywords] of Object.entries(layerKeywords)) {
              if (keywords.some(keyword => lowerEntry.includes(keyword))) {
                layers.add(layer);
              }
            }
            
            scanDir(fullPath);
          }
        }
      } catch (error) {
        logger.warn(`無法掃描目錄：${dirPath}`);
      }
    };

    scanDir(this.projectPath);

    if (layers.size === 0) {
      layers.add('monolithic');
    }

    return Array.from(layers);
  }

  private async analyzeDependencies(): Promise<DependencyGraph> {
    const nodes: Set<string> = new Set();
    const edges: Array<{ from: string; to: string; type: string }> = [];

    const scanFile = (filePath: string) => {
      try {
        const content = readFileSync(filePath, 'utf-8');
        const fileName = filePath.split(/[/\\]/).pop() || '';
        
        nodes.add(fileName);

        const importRegex = /import\s+.*?\s+from\s+['"](.+?)['"]/g;
        const requireRegex = /require\(['"](.+?)['"]\)/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            edges.push({ from: fileName, to: importPath, type: 'external' });
          } else {
            const targetFile = importPath.split('/').pop() || importPath;
            edges.push({ from: fileName, to: targetFile, type: 'internal' });
          }
        }

        while ((match = requireRegex.exec(content)) !== null) {
          const requirePath = match[1];
          if (!requirePath.startsWith('.') && !requirePath.startsWith('/')) {
            edges.push({ from: fileName, to: requirePath, type: 'external' });
          }
        }
      } catch (error) {
      }
    };

    const scanDir = (dirPath: string) => {
      try {
        const entries = readdirSync(dirPath);
        
        for (const entry of entries) {
          const fullPath = join(dirPath, entry);
          const stat = statSync(fullPath);
          
          if (stat.isDirectory()) {
            if (entry === 'node_modules' || entry === '.git' || entry === 'dist') continue;
            scanDir(fullPath);
          } else if (stat.isFile()) {
            const ext = extname(entry);
            if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'].includes(ext)) {
              scanFile(fullPath);
            }
          }
        }
      } catch (error) {
      }
    };

    scanDir(this.projectPath);

    return {
      nodes: Array.from(nodes),
      edges,
    };
  }

  private detectArchitecturePattern(layers: string[], dependencies: DependencyGraph): string {
    if (layers.includes('presentation') && layers.includes('business') && layers.includes('data')) {
      return 'Layered Architecture (MVC/Clean Architecture)';
    }

    if (dependencies.nodes.some(n => n.includes('service')) && 
        dependencies.edges.some(e => e.type === 'external' && e.to.includes('grpc'))) {
      return 'Microservices Architecture';
    }

    if (dependencies.edges.some(e => e.to.includes('lambda') || e.to.includes('serverless'))) {
      return 'Serverless Architecture';
    }

    if (dependencies.edges.some(e => e.to.includes('event') || e.to.includes('kafka') || e.to.includes('rabbitmq'))) {
      return 'Event-Driven Architecture';
    }

    if (dependencies.nodes.some(n => n.includes('component') || n.includes('ui'))) {
      return 'Component-Based Architecture';
    }

    return 'Monolithic Architecture';
  }

  private calculateComplexity(dependencies: DependencyGraph): number {
    const n = dependencies.nodes.length;
    const e = dependencies.edges.length;
    
    if (n === 0) return 0;

    const cyclomaticComplexity = e - n + 2;
    const coupling = e / Math.max(n, 1);
    
    const normalizedComplexity = (cyclomaticComplexity * 0.6 + coupling * 0.4) / 10;
    
    return Math.min(Math.max(normalizedComplexity, 0), 10);
  }

  private calculateModularity(dependencies: DependencyGraph): number {
    const internalEdges = dependencies.edges.filter(e => e.type === 'internal').length;
    const externalEdges = dependencies.edges.filter(e => e.type === 'external').length;
    const totalEdges = dependencies.edges.length;

    if (totalEdges === 0) return 10;

    const internalRatio = internalEdges / totalEdges;
    const externalRatio = externalEdges / totalEdges;

    const modularity = (internalRatio * 0.4 + externalRatio * 0.6) * 10;
    
    return Math.min(Math.max(modularity, 0), 10);
  }

  async suggestArchitecture(requirements: string): Promise<string> {
    logger.info('🏗️ 根據需求推薦架構...');

    const keywords = requirements.toLowerCase();

    if (keywords.includes('microservice') || keywords.includes('scalable') || keywords.includes('distributed')) {
      return `
### 推薦架構：Microservices Architecture

**理由**：
- 高度可擴展
- 獨立部署
- 容錯性強
- 技術多樣性

**技術棧建議**：
- API Gateway: Kong / AWS API Gateway
- Service Mesh: Istio / Linkerd
- Message Queue: Kafka / RabbitMQ
- Service Discovery: Consul / Eureka
- Database: PostgreSQL + Redis + MongoDB (Polyglot Persistence)
- Container: Docker + Kubernetes
      `;
    }

    if (keywords.includes('serverless') || keywords.includes('lambda') || keywords.includes('faas')) {
      return `
### 推薦架構：Serverless Architecture

**理由**：
- 零運維
- 按需計費
- 自動擴展
- 快速開發

**技術棧建議**：
- Functions: AWS Lambda / Azure Functions / Google Cloud Functions
- API: API Gateway + Lambda
- Database: DynamoDB / Firestore / CosmosDB
- Storage: S3 / Azure Blob
- Queue: SQS / EventBridge
- Framework: Serverless Framework / SAM / Terraform
      `;
    }

    if (keywords.includes('real-time') || keywords.includes('event') || keywords.includes('streaming')) {
      return `
### 推薦架構：Event-Driven Architecture

**理由**：
- 實時響應
- 解耦合
- 高吞吐量
- 異步處理

**技術棧建議**：
- Message Broker: Apache Kafka / RabbitMQ / AWS SNS/SQS
- Stream Processing: Apache Flink / Kafka Streams
- Database: EventStore / MongoDB (Event Sourcing)
- API: WebSocket / Server-Sent Events
- CQRS Pattern 實現
      `;
    }

    return `
### 推薦架構：Layered Clean Architecture

**理由**：
- 清晰的關注點分離
- 易於測試
- 可維護性高
- 適合大多數應用

**技術棧建議**：
- Presentation Layer: React / Vue / Angular
- Business Layer: Node.js / Python / Go
- Data Layer: PostgreSQL / MongoDB + Redis
- Infrastructure: Docker + GitHub Actions
- Testing: Jest / Pytest + Playwright
    `;
  }
}

export default FusionArchitect;
