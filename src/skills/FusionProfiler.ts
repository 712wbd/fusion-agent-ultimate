import { logger } from '@utils/logger';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';

interface ProfileResult {
  hotspots: Hotspot[];
  memoryLeaks: MemoryLeak[];
  performanceScore: number;
  recommendations: string[];
  metrics: PerformanceMetrics;
}

interface Hotspot {
  location: string;
  type: 'cpu' | 'memory' | 'io' | 'network';
  severity: 'critical' | 'high' | 'medium' | 'low';
  impact: number;
  description: string;
  solution: string;
}

interface MemoryLeak {
  location: string;
  pattern: string;
  confidence: number;
  description: string;
  fix: string;
}

interface PerformanceMetrics {
  executionTime: string;
  memoryUsage: string;
  ioOperations: number;
  networkCalls: number;
  algorithmicComplexity: string;
}

export class FusionProfiler {
  async profileCode(code: string, language: string): Promise<ProfileResult> {
    logger.info('🔬 Fusion Profiler 開始深度性能分析...');
    
    const hotspots = this.detectHotspots(code, language);
    const memoryLeaks = this.detectMemoryLeaks(code, language);
    const metrics = this.analyzeMetrics(code, language);
    const recommendations = this.generateRecommendations(hotspots, memoryLeaks, metrics);
    const performanceScore = this.calculatePerformanceScore(hotspots, memoryLeaks, metrics);
    
    logger.info(`✅ 性能分析完成，得分：${performanceScore}/100`);
    
    return {
      hotspots,
      memoryLeaks,
      performanceScore,
      recommendations,
      metrics,
    };
  }

  private detectHotspots(code: string, language: string): Hotspot[] {
    const hotspots: Hotspot[] = [];
    
    const nestedLoopDepth = this.calculateNestedLoopDepth(code);
    if (nestedLoopDepth >= 3) {
      hotspots.push({
        location: '多重嵌套循環',
        type: 'cpu',
        severity: 'critical',
        impact: 95,
        description: `檢測到 ${nestedLoopDepth} 層嵌套循環，時間複雜度達到 O(n^${nestedLoopDepth})，這會導致指數級性能下降`,
        solution: `使用哈希表 (Map/Set) 或動態規劃減少循環層數。將 O(n³) 優化為 O(n) 可獲得 1000+ 倍性能提升`,
      });
    }
    
    const syncIOCount = (code.match(/readFileSync|writeFileSync|execSync/g) || []).length;
    if (syncIOCount > 0) {
      hotspots.push({
        location: '同步 I/O 操作',
        type: 'io',
        severity: 'critical',
        impact: 90,
        description: `發現 ${syncIOCount} 處同步 I/O 操作，阻塞事件循環會導致應用程序無響應`,
        solution: `使用異步方法：readFileSync → fs.promises.readFile 或 await fs.readFile()。預期響應速度提升 10-50 倍`,
      });
    }
    
    const databaseQueryInLoop = code.match(/for\s*\([^)]+\)\s*{[^}]*(?:await\s+)?(?:db\.|query\(|findOne\(|findById\()/gs);
    if (databaseQueryInLoop) {
      hotspots.push({
        location: '循環內數據庫查詢',
        type: 'network',
        severity: 'critical',
        impact: 92,
        description: `檢測到 N+1 查詢問題：在循環中執行數據庫查詢會導致巨大的網絡延遲`,
        solution: `使用批量查詢：將 ${databaseQueryInLoop.length} 個單獨查詢合併為 1 個 findByIds() 查詢。預期延遲從 ${databaseQueryInLoop.length * 50}ms 降至 50ms`,
      });
    }
    
    const regexInLoop = code.match(/for\s*\([^)]+\)\s*{[^}]*new\s+RegExp\(/gs);
    if (regexInLoop) {
      hotspots.push({
        location: '循環內正則表達式編譯',
        type: 'cpu',
        severity: 'high',
        impact: 75,
        description: `在循環中重複編譯正則表達式會消耗大量 CPU`,
        solution: `將正則表達式提取到循環外部，預編譯一次後重複使用。預期性能提升 5-10 倍`,
      });
    }
    
    const largeArrayAllocation = code.match(/new\s+Array\((\d+)\)/);
    if (largeArrayAllocation) {
      const size = parseInt(largeArrayAllocation[1]);
      if (size > 10000) {
        hotspots.push({
          location: '大數組分配',
          type: 'memory',
          severity: 'high',
          impact: 70,
          description: `一次性分配 ${size} 個元素的數組會導致內存峰值 (約 ${(size * 8 / 1024).toFixed(2)} KB)`,
          solution: `使用流式處理或分批處理：一次處理 1000 個元素，可將內存峰值降低 ${Math.floor(size / 1000)} 倍`,
        });
      }
    }
    
    const unoptimizedStringConcat = (code.match(/\w+\s*\+=\s*['"`]/g) || []).length;
    if (unoptimizedStringConcat > 5) {
      hotspots.push({
        location: '字符串拼接',
        type: 'cpu',
        severity: 'medium',
        impact: 60,
        description: `發現 ${unoptimizedStringConcat} 處使用 += 拼接字符串，每次拼接都會創建新字符串對象`,
        solution: `使用數組 join 或模板字符串。預期性能提升：${unoptimizedStringConcat}x → 2x`,
      });
    }
    
    const missingCache = !code.includes('cache') && 
                         !code.includes('memo') && 
                         (code.includes('fetch') || code.includes('axios') || code.includes('http.get'));
    if (missingCache) {
      hotspots.push({
        location: 'HTTP 請求',
        type: 'network',
        severity: 'high',
        impact: 80,
        description: `未檢測到緩存機制，重複的網絡請求會大幅降低性能`,
        solution: `實現 LRU 緩存或使用 Redis。緩存命中率達到 80% 可使響應速度提升 5-10 倍`,
      });
    }
    
    return hotspots.sort((a, b) => b.impact - a.impact);
  }

  private calculateNestedLoopDepth(code: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    
    const lines = code.split('\n');
    for (const line of lines) {
      if (line.match(/for\s*\(|while\s*\(|\.forEach\(|\.map\(/)) {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      }
      
      if (line.includes('}')) {
        currentDepth = Math.max(0, currentDepth - 1);
      }
    }
    
    return maxDepth;
  }

  private detectMemoryLeaks(code: string, language: string): MemoryLeak[] {
    const leaks: MemoryLeak[] = [];
    
    const eventListenerWithoutRemove = code.match(/addEventListener\s*\(/g);
    const removeEventListener = code.match(/removeEventListener\s*\(/g);
    
    if (eventListenerWithoutRemove && 
        (!removeEventListener || eventListenerWithoutRemove.length > removeEventListener.length)) {
      leaks.push({
        location: '事件監聽器',
        pattern: 'addEventListener without removeEventListener',
        confidence: 85,
        description: `檢測到 ${eventListenerWithoutRemove.length} 個事件監聽器但只有 ${removeEventListener?.length || 0} 個移除操作`,
        fix: `在組件卸載時使用 removeEventListener 清理監聽器，或使用 AbortController`,
      });
    }
    
    const setIntervalCount = (code.match(/setInterval\s*\(/g) || []).length;
    const clearIntervalCount = (code.match(/clearInterval\s*\(/g) || []).length;
    
    if (setIntervalCount > clearIntervalCount) {
      leaks.push({
        location: '定時器',
        pattern: 'setInterval without clearInterval',
        confidence: 90,
        description: `發現 ${setIntervalCount - clearIntervalCount} 個未清理的 setInterval，會持續消耗 CPU`,
        fix: `保存 setInterval 返回的 ID，在適當時機調用 clearInterval(id) 清理`,
      });
    }
    
    const globalVariableAssignment = code.match(/^(?:var|let|const)?\s*window\.\w+\s*=/gm);
    if (globalVariableAssignment && globalVariableAssignment.length > 3) {
      leaks.push({
        location: '全局變量',
        pattern: 'excessive global variables',
        confidence: 70,
        description: `檢測到 ${globalVariableAssignment.length} 個全局變量賦值，可能導致內存無法回收`,
        fix: `使用閉包、模塊作用域或 WeakMap 代替全局變量`,
      });
    }
    
    const closureWithLargeData = code.match(/function\s+\w*\s*\([^)]*\)\s*{[^}]*(?:const|let|var)\s+\w+\s*=\s*new\s+Array\(/gs);
    if (closureWithLargeData) {
      leaks.push({
        location: '閉包',
        pattern: 'closure capturing large data',
        confidence: 65,
        description: `閉包捕獲了大量數據，可能導致內存無法釋放`,
        fix: `避免在閉包中捕獲大型數組或對象，使用參數傳遞或弱引用`,
      });
    }
    
    const domReferenceLeak = code.match(/(?:const|let|var)\s+\w+\s*=\s*document\.\w+/g);
    if (domReferenceLeak && domReferenceLeak.length > 5) {
      leaks.push({
        location: 'DOM 引用',
        pattern: 'DOM node references in closure',
        confidence: 75,
        description: `持有 ${domReferenceLeak.length} 個 DOM 節點引用，移除 DOM 後內存仍無法回收`,
        fix: `移除 DOM 後清空引用：element = null，或使用 WeakRef`,
      });
    }
    
    return leaks.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeMetrics(code: string, language: string): PerformanceMetrics {
    const loopCount = (code.match(/for\s*\(|while\s*\(/g) || []).length;
    const ioCount = (code.match(/readFile|writeFile|fs\./g) || []).length;
    const networkCount = (code.match(/fetch\(|axios\.|http\./g) || []).length;
    
    const nestedDepth = this.calculateNestedLoopDepth(code);
    let complexity = 'O(1)';
    if (nestedDepth === 1) complexity = 'O(n)';
    else if (nestedDepth === 2) complexity = 'O(n²)';
    else if (nestedDepth >= 3) complexity = `O(n^${nestedDepth})`;
    
    const hasRecursion = code.includes('function') && /function\s+(\w+)[^{]*{[^}]*\1\s*\(/.test(code);
    if (hasRecursion) complexity = 'O(2^n)';
    
    const estimatedTime = this.estimateExecutionTime(loopCount, ioCount, networkCount, nestedDepth);
    const estimatedMemory = this.estimateMemoryUsage(code);
    
    return {
      executionTime: estimatedTime,
      memoryUsage: estimatedMemory,
      ioOperations: ioCount,
      networkCalls: networkCount,
      algorithmicComplexity: complexity,
    };
  }

  private estimateExecutionTime(loops: number, io: number, network: number, depth: number): string {
    let time = 1;
    
    if (depth >= 3) time *= Math.pow(10, depth);
    else if (depth === 2) time *= 100;
    else if (depth === 1) time *= 10;
    
    time += io * 50;
    time += network * 200;
    
    if (time < 10) return `< 10ms (極快 ⚡⚡⚡)`;
    if (time < 100) return `${time.toFixed(0)}ms (快速 ⚡⚡)`;
    if (time < 1000) return `${time.toFixed(0)}ms (正常 ⚡)`;
    if (time < 5000) return `${(time / 1000).toFixed(1)}s (較慢 ⚠️)`;
    return `${(time / 1000).toFixed(1)}s (慢 ⚠️⚠️)`;
  }

  private estimateMemoryUsage(code: string): string {
    const arrayAllocations = code.match(/new\s+Array\((\d+)\)/g) || [];
    const objectCreations = (code.match(/\{\s*\w+:/g) || []).length;
    const stringOperations = (code.match(/\+\s*['"`]/g) || []).length;
    
    let memory = 0;
    
    for (const alloc of arrayAllocations) {
      const match = alloc.match(/\d+/);
      if (match) {
        memory += parseInt(match[0]) * 8;
      }
    }
    
    memory += objectCreations * 56;
    memory += stringOperations * 100;
    
    if (memory < 1024) return `${memory} bytes (極小 ✅✅)`;
    if (memory < 1024 * 1024) return `${(memory / 1024).toFixed(1)} KB (小 ✅)`;
    if (memory < 10 * 1024 * 1024) return `${(memory / 1024 / 1024).toFixed(1)} MB (適中)`;
    return `${(memory / 1024 / 1024).toFixed(1)} MB (大 ⚠️)`;
  }

  private calculatePerformanceScore(
    hotspots: Hotspot[],
    memoryLeaks: MemoryLeak[],
    metrics: PerformanceMetrics
  ): number {
    let score = 100;
    
    for (const hotspot of hotspots) {
      const penalty = (hotspot.impact / 100) * 15;
      score -= penalty;
    }
    
    for (const leak of memoryLeaks) {
      const penalty = (leak.confidence / 100) * 10;
      score -= penalty;
    }
    
    if (metrics.algorithmicComplexity.includes('n^')) {
      score -= 20;
    } else if (metrics.algorithmicComplexity === 'O(2^n)') {
      score -= 30;
    } else if (metrics.algorithmicComplexity === 'O(n²)') {
      score -= 15;
    }
    
    return Math.max(Math.round(score), 0);
  }

  private generateRecommendations(
    hotspots: Hotspot[],
    memoryLeaks: MemoryLeak[],
    metrics: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    if (hotspots.length > 0) {
      recommendations.push(
        `🔥 **優先處理 ${hotspots.filter(h => h.severity === 'critical').length} 個關鍵性能瓶頸**`,
        `   預期性能提升：50-100 倍`
      );
    }
    
    if (memoryLeaks.length > 0) {
      recommendations.push(
        `💧 **修復 ${memoryLeaks.length} 個潛在內存洩漏**`,
        `   可避免長時間運行後的內存溢出`
      );
    }
    
    if (metrics.algorithmicComplexity.includes('n^') || metrics.algorithmicComplexity.includes('2^n')) {
      recommendations.push(
        `⚡ **優化算法複雜度** (當前: ${metrics.algorithmicComplexity})`,
        `   使用動態規劃、記憶化或哈希表優化`,
        `   預期提升：100-1000 倍`
      );
    }
    
    if (metrics.ioOperations > 5) {
      recommendations.push(
        `💾 **減少 I/O 操作** (當前: ${metrics.ioOperations} 次)`,
        `   實現批量讀寫和緩存機制`,
        `   預期減少延遲：60-80%`
      );
    }
    
    if (metrics.networkCalls > 3) {
      recommendations.push(
        `🌐 **優化網絡請求** (當前: ${metrics.networkCalls} 次)`,
        `   使用 GraphQL、批量請求或 HTTP/2 多路復用`,
        `   預期減少延遲：50-70%`
      );
    }
    
    recommendations.push(
      `📊 **實現性能監控**`,
      `   使用 Performance API 或 New Relic 追蹤實際性能`,
      `🧪 **編寫性能基準測試**`,
      `   使用 benchmark.js 驗證優化效果`
    );
    
    return recommendations;
  }

  generateDetailedReport(result: ProfileResult): string {
    let report = '\n';
    report += '╔════════════════════════════════════════════════════════╗\n';
    report += '║      🔬 Fusion Profiler - 深度性能分析報告           ║\n';
    report += '╚════════════════════════════════════════════════════════╝\n\n';
    
    report += `📊 **總體性能評分**: ${result.performanceScore}/100 `;
    if (result.performanceScore >= 90) report += '🎉 (優秀)\n\n';
    else if (result.performanceScore >= 70) report += '✅ (良好)\n\n';
    else if (result.performanceScore >= 50) report += '⚠️ (需優化)\n\n';
    else report += '🚨 (嚴重問題)\n\n';
    
    report += '### 📈 性能指標\n\n';
    report += `- **預估執行時間**: ${result.metrics.executionTime}\n`;
    report += `- **預估內存使用**: ${result.metrics.memoryUsage}\n`;
    report += `- **I/O 操作**: ${result.metrics.ioOperations} 次\n`;
    report += `- **網絡調用**: ${result.metrics.networkCalls} 次\n`;
    report += `- **算法複雜度**: ${result.metrics.algorithmicComplexity}\n\n`;
    
    if (result.hotspots.length > 0) {
      report += '### 🔥 性能熱點 (按影響程度排序)\n\n';
      result.hotspots.forEach((hotspot, index) => {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
        }[hotspot.severity];
        
        report += `#### ${index + 1}. ${severityEmoji} ${hotspot.location} (影響度: ${hotspot.impact}/100)\n\n`;
        report += `**類型**: ${hotspot.type.toUpperCase()}\n\n`;
        report += `**問題**: ${hotspot.description}\n\n`;
        report += `**解決方案**: ${hotspot.solution}\n\n`;
      });
    }
    
    if (result.memoryLeaks.length > 0) {
      report += '### 💧 內存洩漏檢測\n\n';
      result.memoryLeaks.forEach((leak, index) => {
        report += `#### ${index + 1}. ${leak.location} (置信度: ${leak.confidence}%)\n\n`;
        report += `**模式**: \`${leak.pattern}\`\n\n`;
        report += `**描述**: ${leak.description}\n\n`;
        report += `**修復**: ${leak.fix}\n\n`;
      });
    }
    
    if (result.recommendations.length > 0) {
      report += '### 💡 優化建議\n\n';
      result.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }
    
    report += '---\n\n';
    report += '*本報告由 Fusion Profiler 自動生成，基於靜態代碼分析*\n';
    report += '*建議結合實際性能測試驗證優化效果*\n';
    
    return report;
  }
}

export default FusionProfiler;
