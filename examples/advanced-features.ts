import { 
  FusionArchitect, 
  FusionCoder, 
  FusionOptimizer, 
  FusionProfiler, 
  FusionSecurityScanner 
} from '../src';

async function example1_DeepPerformanceProfiling() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Example 1: 深度性能分析 - Fusion Profiler         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const profiler = new FusionProfiler();

  const problematicCode = `
function findCommonElements(arr1, arr2, arr3) {
  const result = [];
  
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      for (const item3 of arr3) {
        if (item1.id === item2.id && item2.id === item3.id) {
          result.push(item1);
        }
      }
    }
  }
  
  const fs = require('fs');
  const data = fs.readFileSync('data.json', 'utf8');
  
  setInterval(() => {
    console.log('Running...');
  }, 1000);
  
  return result;
}
  `;

  const result = await profiler.profileCode(problematicCode, 'javascript');

  console.log(`📊 性能評分: ${result.performanceScore}/100`);
  console.log(`🔥 發現 ${result.hotspots.length} 個性能熱點`);
  console.log(`💧 檢測到 ${result.memoryLeaks.length} 個內存洩漏\n`);

  console.log('🔥 性能熱點詳情:');
  result.hotspots.forEach((hotspot, index) => {
    console.log(`\n${index + 1}. ${hotspot.location} (影響度: ${hotspot.impact}/100)`);
    console.log(`   類型: ${hotspot.type.toUpperCase()}`);
    console.log(`   問題: ${hotspot.description}`);
    console.log(`   解決: ${hotspot.solution.substring(0, 100)}...`);
  });

  console.log('\n💧 內存洩漏詳情:');
  result.memoryLeaks.forEach((leak, index) => {
    console.log(`\n${index + 1}. ${leak.location} (置信度: ${leak.confidence}%)`);
    console.log(`   模式: ${leak.pattern}`);
    console.log(`   修復: ${leak.fix.substring(0, 100)}...`);
  });

  const report = profiler.generateDetailedReport(result);
  console.log('\n' + report);
}

async function example2_EnterpriseSecurityScanning() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Example 2: 企業級安全掃描 - Fusion Security Scanner║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const scanner = new FusionSecurityScanner();

  const vulnerableCode = `
const express = require('express');
const app = express();

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  db.query(query, (err, results) => {
    if (results.length > 0) {
      res.json({ success: true });
    }
  });
});

app.post('/search', (req, res) => {
  const searchTerm = req.body.term;
  document.getElementById('results').innerHTML = searchTerm;
});

const API_KEY = "sk-1234567890abcdefghijklmnop";
const DB_PASSWORD = "MySecretPassword123";

function hashPassword(password) {
  return md5(password);
}

function generateToken() {
  return Math.random().toString(36);
}

console.log('User password:', userPassword);
  `;

  const result = await scanner.scanCode(vulnerableCode, 'javascript');

  console.log(`🔒 安全等級: ${result.securityGrade}`);
  console.log(`⚠️  風險評分: ${result.riskScore}/100`);
  console.log(`🛡️  發現 ${result.vulnerabilities.length} 個安全問題\n`);

  const severityCounts = {
    critical: result.vulnerabilities.filter(v => v.severity === 'critical').length,
    high: result.vulnerabilities.filter(v => v.severity === 'high').length,
    medium: result.vulnerabilities.filter(v => v.severity === 'medium').length,
    low: result.vulnerabilities.filter(v => v.severity === 'low').length,
  };

  console.log('📊 漏洞分布:');
  console.log(`   🔴 嚴重: ${severityCounts.critical}`);
  console.log(`   🟠 高危: ${severityCounts.high}`);
  console.log(`   🟡 中危: ${severityCounts.medium}`);
  console.log(`   🟢 低危: ${severityCounts.low}\n`);

  console.log('🛡️  漏洞詳情 (前3個):');
  result.vulnerabilities.slice(0, 3).forEach((vuln, index) => {
    const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[vuln.severity];
    console.log(`\n${index + 1}. ${severityEmoji} [${vuln.id}] ${vuln.location}`);
    console.log(`   嚴重程度: ${vuln.severity.toUpperCase()}`);
    console.log(`   標準: ${vuln.cwe} / ${vuln.owasp}`);
    console.log(`   描述: ${vuln.description}`);
    console.log(`   影響: ${vuln.impact.substring(0, 80)}...`);
  });

  console.log('\n📋 合規性檢查:');
  result.compliance.forEach(comp => {
    const icon = comp.compliant ? '✅' : '❌';
    console.log(`${icon} ${comp.standard}: ${comp.compliant ? '符合' : '不符合'}`);
  });

  const report = scanner.generateSecurityReport(result);
  console.log('\n' + report);
}

async function example3_ArchitectureVisualization() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Example 3: 架構可視化與反模式檢測                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const architect = new FusionArchitect('./your-project');

  const analysis = await architect.analyzeArchitecture();

  console.log(`🏗️  架構模式: ${analysis.pattern}`);
  console.log(`📊 層次結構: ${analysis.layers.join(', ')}`);
  console.log(`🔢 複雜度: ${analysis.complexity.toFixed(2)}/10`);
  console.log(`🧩 模組化: ${analysis.modularity.toFixed(2)}/10\n`);

  console.log('📦 依賴分析:');
  console.log(`   節點數: ${analysis.dependencies.nodes.length}`);
  console.log(`   邊數: ${analysis.dependencies.edges.length}`);
  console.log(`   耦合度: ${(analysis.dependencies.edges.length / Math.max(analysis.dependencies.nodes.length, 1)).toFixed(2)}\n`);

  const mermaidChart = await architect.generateArchitectureVisualization(analysis);
  console.log('🎨 Mermaid 架構圖:');
  console.log(mermaidChart);

  const antiPatterns = await architect.detectAntiPatterns(analysis.dependencies);
  if (antiPatterns.length > 0) {
    console.log('\n🚨 發現反模式:');
    antiPatterns.forEach((pattern, index) => {
      console.log(`${index + 1}. ${pattern}`);
    });
  } else {
    console.log('\n✅ 未發現架構反模式');
  }
}

async function example4_DesignPatternDetection() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Example 4: 設計模式識別與應用                       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const coder = new FusionCoder(process.env.ANTHROPIC_API_KEY);

  const codeWithPatterns = `
class DatabaseConnection {
  private static instance: DatabaseConnection;
  
  private constructor() {}
  
  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}

class UserFactory {
  static createUser(type: string) {
    switch(type) {
      case 'admin': return new AdminUser();
      case 'guest': return new GuestUser();
      default: throw new Error('Unknown user type');
    }
  }
}

class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  
  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
  }
  
  emit(event: string, data: any) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach(handler => handler(data));
  }
}
  `;

  const patterns = coder.detectDesignPatterns(codeWithPatterns);

  console.log(`🔍 檢測到 ${patterns.length} 種設計模式:\n`);
  patterns.forEach((pattern, index) => {
    console.log(`${index + 1}. ${pattern.pattern}`);
    console.log(`   位置: ${pattern.location}`);
    console.log(`   置信度: ${pattern.confidence}%\n`);
  });

  console.log('🎨 應用單例模式:');
  const singletonCode = await coder.applyDesignPattern('', 'singleton');
  console.log(singletonCode);

  console.log('\n📊 代碼複雜度分析:');
  const metrics = coder.calculateComplexityMetrics(codeWithPatterns);
  console.log(`   圈複雜度: ${metrics.cyclomaticComplexity}`);
  console.log(`   認知複雜度: ${metrics.cognitiveComplexity}`);
  console.log(`   代碼行數: ${metrics.linesOfCode}`);
  console.log(`   可維護性指數: ${metrics.maintainabilityIndex}/100`);
}

async function example5_ComprehensiveCodeAnalysis() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Example 5: 綜合代碼分析 - 所有引擎聯動            ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const complexCode = `
async function processUserData(userIds) {
  const results = [];
  
  for (const userId of userIds) {
    for (const dataType of ['profile', 'settings', 'history']) {
      const data = await db.findOne({ userId, type: dataType });
      
      if (data) {
        for (const field in data) {
          if (data[field].includes('<script>')) {
            eval('sanitize(' + data[field] + ')');
          }
        }
        
        results.push(data);
      }
    }
  }
  
  return results;
}
  `;

  console.log('🔬 正在執行綜合分析...\n');

  console.log('1️⃣ 性能分析:');
  const profiler = new FusionProfiler();
  const perfResult = await profiler.profileCode(complexCode, 'javascript');
  console.log(`   評分: ${perfResult.performanceScore}/100`);
  console.log(`   複雜度: ${perfResult.metrics.algorithmicComplexity}`);
  console.log(`   熱點: ${perfResult.hotspots.length} 個`);

  console.log('\n2️⃣ 安全掃描:');
  const scanner = new FusionSecurityScanner();
  const secResult = await scanner.scanCode(complexCode, 'javascript');
  console.log(`   等級: ${secResult.securityGrade}`);
  console.log(`   風險: ${secResult.riskScore}/100`);
  console.log(`   漏洞: ${secResult.vulnerabilities.length} 個`);

  console.log('\n3️⃣ 複雜度分析:');
  const coder = new FusionCoder();
  const metrics = coder.calculateComplexityMetrics(complexCode);
  console.log(`   圈複雜度: ${metrics.cyclomaticComplexity}`);
  console.log(`   認知複雜度: ${metrics.cognitiveComplexity}`);
  console.log(`   可維護性: ${metrics.maintainabilityIndex}/100`);

  console.log('\n4️⃣ 優化建議:');
  const optimizer = new FusionOptimizer();
  const optMetrics = await optimizer.analyzePerformance(complexCode, 'javascript');
  console.log(`   時間複雜度: ${optMetrics.timeComplexity}`);
  console.log(`   瓶頸數量: ${optMetrics.bottlenecks.length}`);
  console.log(`   優化機會: ${optMetrics.optimizationOpportunities.length}`);

  console.log('\n📊 綜合評估:');
  const overallScore = (
    perfResult.performanceScore * 0.3 +
    (100 - secResult.riskScore) * 0.3 +
    metrics.maintainabilityIndex * 0.2 +
    (10 - optMetrics.bottlenecks.length * 2) * 10 * 0.2
  );
  console.log(`   總體評分: ${Math.round(overallScore)}/100`);

  if (overallScore >= 90) {
    console.log('   等級: 🏆 優秀');
  } else if (overallScore >= 70) {
    console.log('   等級: ✅ 良好');
  } else if (overallScore >= 50) {
    console.log('   等級: ⚠️  需改進');
  } else {
    console.log('   等級: 🚨 嚴重問題');
  }

  console.log('\n💡 最優先建議:');
  if (perfResult.hotspots.length > 0) {
    console.log(`   1. ${perfResult.hotspots[0].description}`);
  }
  if (secResult.vulnerabilities.length > 0) {
    console.log(`   2. ${secResult.vulnerabilities[0].description}`);
  }
  if (optMetrics.optimizationOpportunities.length > 0) {
    console.log(`   3. ${optMetrics.optimizationOpportunities[0].implementation.substring(0, 60)}...`);
  }
}

async function main() {
  try {
    await example1_DeepPerformanceProfiling();
    
    await example2_EnterpriseSecurityScanning();
    
    await example3_ArchitectureVisualization();
    
    await example4_DesignPatternDetection();
    
    await example5_ComprehensiveCodeAnalysis();

    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ 所有高級示例執行完成                            ║');
    console.log('╚════════════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('❌ 執行錯誤:', error);
  }
}

if (require.main === module) {
  main();
}

export {
  example1_DeepPerformanceProfiling,
  example2_EnterpriseSecurityScanning,
  example3_ArchitectureVisualization,
  example4_DesignPatternDetection,
  example5_ComprehensiveCodeAnalysis,
};
