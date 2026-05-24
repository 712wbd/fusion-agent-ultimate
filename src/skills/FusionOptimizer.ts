import { logger } from '@utils/logger';
import type { PerformanceMetrics, OptimizationOpportunity, Bottleneck } from '@types/index';
import { readFileSync } from 'fs';

export class FusionOptimizer {
  async analyzePerformance(code: string, language: string): Promise<PerformanceMetrics> {
    logger.info('⚡ Fusion Optimizer 分析性能...');

    const timeComplexity = this.analyzeTimeComplexity(code);
    const spaceComplexity = this.analyzeSpaceComplexity(code);
    const bottlenecks = this.detectBottlenecks(code, language);
    const opportunities = this.findOptimizationOpportunities(code, language);

    return {
      timeComplexity,
      spaceComplexity,
      bottlenecks,
      optimizationOpportunities: opportunities,
    };
  }

  private analyzeTimeComplexity(code: string): string {
    const nestedLoops = (code.match(/for\s*\(/g) || []).length;
    const whileLoops = (code.match(/while\s*\(/g) || []).length;
    const recursion = (code.match(/function\s+\w+\s*\([^)]*\)\s*{[^}]*\1\(/g) || []).length;

    if (recursion > 0) {
      return 'O(2^n) - 指數時間（遞歸）⚠️';
    }

    if (nestedLoops >= 3) {
      return 'O(n^3) - 立方時間 ⚠️⚠️⚠️';
    }

    if (nestedLoops === 2) {
      return 'O(n^2) - 平方時間 ⚠️⚠️';
    }

    if (nestedLoops === 1 || whileLoops > 0) {
      return 'O(n) - 線性時間 ✅';
    }

    if (code.includes('sort') || code.includes('.sort(')) {
      return 'O(n log n) - 對數線性時間 ✅';
    }

    return 'O(1) - 常數時間 ✅✅';
  }

  private analyzeSpaceComplexity(code: string): string {
    const arrays = (code.match(/\[\s*\]/g) || []).length;
    const objects = (code.match(/\{\s*\}/g) || []).length;
    const maps = (code.match(/new\s+Map\(/g) || []).length;
    const sets = (code.match(/new\s+Set\(/g) || []).length;

    const totalDataStructures = arrays + objects + maps + sets;

    if (totalDataStructures > 5) {
      return 'O(n) - 線性空間 ⚠️';
    }

    if (totalDataStructures > 0) {
      return 'O(n) - 線性空間 ✅';
    }

    return 'O(1) - 常數空間 ✅✅';
  }

  private detectBottlenecks(code: string, language: string): Bottleneck[] {
    const bottlenecks: Bottleneck[] = [];

    if (code.match(/for.*for/s)) {
      bottlenecks.push({
        location: '嵌套循環',
        type: 'cpu',
        impact: 8,
        description: '嵌套循環導致 O(n^2) 時間複雜度，建議使用哈希表優化',
      });
    }

    if (code.includes('readFileSync') || code.includes('writeFileSync')) {
      bottlenecks.push({
        location: '同步文件操作',
        type: 'io',
        impact: 9,
        description: '同步 I/O 阻塞事件循環，建議使用異步方法',
      });
    }

    if (code.includes('JSON.stringify') && code.length > 1000) {
      bottlenecks.push({
        location: 'JSON 序列化',
        type: 'cpu',
        impact: 6,
        description: '大對象序列化耗時，考慮增量序列化或使用更快的庫',
      });
    }

    if (!code.includes('cache') && code.includes('fetch')) {
      bottlenecks.push({
        location: 'HTTP 請求',
        type: 'network',
        impact: 7,
        description: '缺少緩存機制，建議實現 Redis 或內存緩存',
      });
    }

    if (code.match(/new\s+Array\(\d{4,}\)/)) {
      bottlenecks.push({
        location: '大數組分配',
        type: 'memory',
        impact: 6,
        description: '一次性分配大數組可能導致內存峰值，考慮流式處理',
      });
    }

    return bottlenecks;
  }

  private findOptimizationOpportunities(code: string, language: string): OptimizationOpportunity[] {
    const opportunities: OptimizationOpportunity[] = [];

    const nestedLoopMatch = code.match(/for\s*\([^)]+\)\s*{[^}]*for\s*\([^)]+\)/s);
    if (nestedLoopMatch) {
      opportunities.push({
        type: '算法優化',
        location: '嵌套循環',
        currentComplexity: 'O(n^2)',
        targetComplexity: 'O(n)',
        expectedImprovement: '10-100 倍性能提升',
        implementation: `
使用 Map/Set 替換嵌套循環：

// 優化前：O(n^2)
for (const item1 of arr1) {
  for (const item2 of arr2) {
    if (item1.id === item2.id) {
      // 處理
    }
  }
}

// 優化後：O(n)
const map = new Map(arr2.map(item => [item.id, item]));
for (const item1 of arr1) {
  const item2 = map.get(item1.id);
  if (item2) {
    // 處理
  }
}
        `,
      });
    }

    if (code.includes('await') && !code.includes('Promise.all')) {
      opportunities.push({
        type: '並發優化',
        location: '串行異步操作',
        currentComplexity: 'O(n * t)',
        targetComplexity: 'O(t)',
        expectedImprovement: 'n 倍性能提升',
        implementation: `
並行執行獨立的異步操作：

// 優化前：串行執行
const result1 = await fetchData1();
const result2 = await fetchData2();
const result3 = await fetchData3();

// 優化後：並行執行
const [result1, result2, result3] = await Promise.all([
  fetchData1(),
  fetchData2(),
  fetchData3(),
]);
        `,
      });
    }

    if (!code.includes('memo') && code.includes('function') && code.match(/function\s+\w+.*{\s*return/)) {
      opportunities.push({
        type: '緩存優化',
        location: '純函數調用',
        currentComplexity: 'O(n)',
        targetComplexity: 'O(1)',
        expectedImprovement: '100+ 倍性能提升（對於重複調用）',
        implementation: `
使用 Memoization 緩存純函數結果：

// 優化前：每次都計算
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// 優化後：緩存結果
const memo = new Map();
function fibonacci(n) {
  if (n <= 1) return n;
  if (memo.has(n)) return memo.get(n);
  
  const result = fibonacci(n - 1) + fibonacci(n - 2);
  memo.set(n, result);
  return result;
}
        `,
      });
    }

    return opportunities;
  }

  async optimizeCode(code: string, language: string): Promise<string> {
    logger.info('⚡ 自動優化代碼...');

    let optimized = code;

    optimized = this.optimizeNestedLoops(optimized);
    optimized = this.optimizeStringConcatenation(optimized);
    optimized = this.optimizeArrayOperations(optimized);

    return optimized;
  }

  private optimizeNestedLoops(code: string): string {
    const nestedLoopPattern = /for\s*\(\s*(?:const|let|var)\s+(\w+)\s+of\s+(\w+)\s*\)\s*{([^}]*for\s*\([^}]+\))/s;
    
    if (nestedLoopPattern.test(code)) {
      logger.info('🔧 檢測到嵌套循環，建議使用 Map 優化');
    }

    return code;
  }

  private optimizeStringConcatenation(code: string): string {
    const stringConcatPattern = /(\w+)\s*\+=\s*['"]/g;
    
    if (stringConcatPattern.test(code)) {
      logger.info('🔧 檢測到字符串拼接，建議使用數組 join');
      return code.replace(
        /let\s+(\w+)\s*=\s*['"];[\s\S]*?\1\s*\+=\s*/g,
        'const parts = [];\n// 收集所有部分後使用 parts.join("")'
      );
    }

    return code;
  }

  private optimizeArrayOperations(code: string): string {
    if (code.includes('.filter(') && code.includes('.map(')) {
      logger.info('🔧 檢測到鏈式數組操作，建議合併為單次遍歷');
    }

    return code;
  }

  generatePerformanceReport(metrics: PerformanceMetrics): string {
    let report = '\n';
    report += '📊 性能分析報告\n';
    report += '═'.repeat(50) + '\n\n';
    
    report += `⏱️  時間複雜度: ${metrics.timeComplexity}\n`;
    report += `💾 空間複雜度: ${metrics.spaceComplexity}\n\n`;

    if (metrics.bottlenecks.length > 0) {
      report += '🔴 性能瓶頸:\n';
      metrics.bottlenecks.forEach((b, i) => {
        report += `\n${i + 1}. ${b.location} (${b.type.toUpperCase()})\n`;
        report += `   影響程度: ${'🔥'.repeat(Math.ceil(b.impact / 3))}\n`;
        report += `   ${b.description}\n`;
      });
      report += '\n';
    }

    if (metrics.optimizationOpportunities.length > 0) {
      report += '💡 優化建議:\n';
      metrics.optimizationOpportunities.forEach((o, i) => {
        report += `\n${i + 1}. ${o.type} - ${o.location}\n`;
        report += `   ${o.currentComplexity} → ${o.targetComplexity}\n`;
        report += `   預期提升: ${o.expectedImprovement}\n`;
      });
    }

    return report;
  }
}

export default FusionOptimizer;
