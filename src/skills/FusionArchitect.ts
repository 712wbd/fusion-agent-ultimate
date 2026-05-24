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
    const cohesion = this.calculateCohesion(dependencies);
    const circularDeps = this.detectCircularDependencies(dependencies);
    
    const baseComplexity = (cyclomaticComplexity * 0.4 + coupling * 0.3) / 10;
    const cohesionPenalty = (10 - cohesion) * 0.2;
    const circularPenalty = Math.min(circularDeps.length * 0.5, 3);
    
    const finalComplexity = baseComplexity + cohesionPenalty + circularPenalty;
    
    return Math.min(Math.max(finalComplexity, 0), 10);
  }

  private calculateCohesion(dependencies: DependencyGraph): number {
    if (dependencies.nodes.length === 0) return 10;
    
    const internalEdges = dependencies.edges.filter(e => e.type === 'internal').length;
    const totalNodes = dependencies.nodes.length;
    const maxPossibleEdges = (totalNodes * (totalNodes - 1)) / 2;
    
    if (maxPossibleEdges === 0) return 10;
    
    const cohesionRatio = internalEdges / maxPossibleEdges;
    return Math.min(cohesionRatio * 10, 10);
  }

  private detectCircularDependencies(dependencies: DependencyGraph): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const adjacencyList = new Map<string, string[]>();
    for (const node of dependencies.nodes) {
      adjacencyList.set(node, []);
    }
    
    for (const edge of dependencies.edges) {
      if (edge.type === 'internal') {
        const targets = adjacencyList.get(edge.from) || [];
        targets.push(edge.to);
        adjacencyList.set(edge.from, targets);
      }
    }
    
    const dfs = (node: string, path: string[]): boolean => {
      visited.add(node);
      recursionStack.add(node);
      path.push(node);
      
      const neighbors = adjacencyList.get(node) || [];
      for (const neighbor of neighbors) {
        if (!adjacencyList.has(neighbor)) continue;
        
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, path)) return true;
        } else if (recursionStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor);
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart));
          }
          return true;
        }
      }
      
      recursionStack.delete(node);
      path.pop();
      return false;
    };
    
    for (const node of dependencies.nodes) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }
    
    return cycles;
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

  async generateArchitectureVisualization(analysis: ArchitectureAnalysis): Promise<string> {
    logger.info('🎨 生成架構可視化圖表（Mermaid）...');
    
    let mermaid = '```mermaid\n';
    mermaid += 'graph TB\n';
    mermaid += '  classDef presentationClass fill:#4A90E2,stroke:#2E5C8A,color:#fff;\n';
    mermaid += '  classDef businessClass fill:#50C878,stroke:#2E7D4E,color:#fff;\n';
    mermaid += '  classDef dataClass fill:#F39C12,stroke:#B8740F,color:#fff;\n';
    mermaid += '  classDef infraClass fill:#9B59B6,stroke:#6C3483,color:#fff;\n\n';
    
    const nodesByLayer = new Map<string, string[]>();
    for (const layer of analysis.layers) {
      nodesByLayer.set(layer, []);
    }
    
    const nodeMap = new Map<string, string>();
    analysis.dependencies.nodes.forEach((node, index) => {
      const nodeId = `N${index}`;
      const sanitizedName = node.replace(/[^a-zA-Z0-9]/g, '_');
      nodeMap.set(node, nodeId);
      
      let layerClass = 'infraClass';
      const nodeLower = node.toLowerCase();
      if (nodeLower.includes('view') || nodeLower.includes('component') || nodeLower.includes('ui')) {
        layerClass = 'presentationClass';
      } else if (nodeLower.includes('service') || nodeLower.includes('handler')) {
        layerClass = 'businessClass';
      } else if (nodeLower.includes('model') || nodeLower.includes('repository')) {
        layerClass = 'dataClass';
      }
      
      mermaid += `  ${nodeId}["${node}"]:::${layerClass}\n`;
    });
    
    mermaid += '\n';
    
    const addedEdges = new Set<string>();
    for (const edge of analysis.dependencies.edges) {
      if (edge.type === 'internal') {
        const fromId = nodeMap.get(edge.from);
        const toId = nodeMap.get(edge.to);
        
        if (fromId && toId) {
          const edgeKey = `${fromId}->${toId}`;
          if (!addedEdges.has(edgeKey)) {
            mermaid += `  ${fromId} --> ${toId}\n`;
            addedEdges.add(edgeKey);
          }
        }
      }
    }
    
    mermaid += '```\n\n';
    
    mermaid += '### 圖表說明\n';
    mermaid += '- 🔵 **藍色**：表現層（Presentation Layer）\n';
    mermaid += '- 🟢 **綠色**：業務層（Business Layer）\n';
    mermaid += '- 🟡 **橙色**：數據層（Data Layer）\n';
    mermaid += '- 🟣 **紫色**：基礎設施層（Infrastructure Layer）\n';
    
    return mermaid;
  }

  async detectAntiPatterns(dependencies: DependencyGraph): Promise<string[]> {
    const antiPatterns: string[] = [];
    
    const circularDeps = this.detectCircularDependencies(dependencies);
    if (circularDeps.length > 0) {
      antiPatterns.push(
        `🔴 循環依賴 (Circular Dependencies): 檢測到 ${circularDeps.length} 個循環依賴鏈。` +
        `這會導致模組耦合度過高，難以維護和測試。建議使用依賴注入或事件驅動模式解決。`
      );
    }
    
    const degreeMap = new Map<string, { in: number; out: number }>();
    for (const node of dependencies.nodes) {
      degreeMap.set(node, { in: 0, out: 0 });
    }
    
    for (const edge of dependencies.edges) {
      if (edge.type === 'internal') {
        const from = degreeMap.get(edge.from);
        const to = degreeMap.get(edge.to);
        if (from) from.out++;
        if (to) to.in++;
      }
    }
    
    for (const [node, degree] of degreeMap.entries()) {
      if (degree.out > 10) {
        antiPatterns.push(
          `🟡 上帝對象 (God Object): "${node}" 依賴了 ${degree.out} 個模組。` +
          `建議拆分為多個職責單一的小模組。`
        );
      }
      
      if (degree.in > 15) {
        antiPatterns.push(
          `🟠 中心化依賴 (Hub Dependency): "${node}" 被 ${degree.in} 個模組依賴。` +
          `這個模組的變更會影響大量其他模組，建議重構以減少耦合。`
        );
      }
    }
    
    const isolatedNodes = dependencies.nodes.filter(node => {
      const degree = degreeMap.get(node);
      return degree && degree.in === 0 && degree.out === 0;
    });
    
    if (isolatedNodes.length > 0) {
      antiPatterns.push(
        `⚪ 孤立模組 (Isolated Modules): 發現 ${isolatedNodes.length} 個孤立模組沒有與其他模組連接。` +
        `可能是未使用的代碼，建議清理。`
      );
    }
    
    return antiPatterns;
  }
}

export default FusionArchitect;
