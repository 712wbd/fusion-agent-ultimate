import { FusionMasterAgent } from '../src/agents/FusionMasterAgent';
import { FusionArchitect } from '../src/skills/FusionArchitect';
import { FusionCoder } from '../src/skills/FusionCoder';
import { FusionOptimizer } from '../src/skills/FusionOptimizer';

async function basicExample() {
  console.log('🌟 Fusion Agent Ultimate - 基礎示例\n');

  const agent = new FusionMasterAgent({
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    learningMode: 'adaptive',
    memoryStoragePath: './data/memory',
    securityLevel: 'high',
    securityScanOnStart: false,
    optimizationLevel: 'aggressive',
    performanceProfiling: true,
    vectorDbProvider: 'local',
    logLevel: 'info',
    logFilePath: './logs/fusion-agent.log',
    autoUpdate: true,
    telemetryEnabled: false,
  });

  await agent.initialize();

  const projectPath = process.cwd();
  console.log(`📊 分析項目：${projectPath}\n`);

  const analysis = await agent.analyzeProject(projectPath, true);
  console.log('✅ 分析完成！\n');
  console.log(JSON.stringify(analysis, null, 2));
}

async function architectureExample() {
  console.log('🏗️ Fusion Architect - 架構設計示例\n');

  const architect = new FusionArchitect(process.cwd());
  
  const analysis = await architect.analyzeArchitecture();
  console.log('📊 架構分析結果：');
  console.log(`  模式：${analysis.pattern}`);
  console.log(`  層次：${analysis.layers.join(', ')}`);
  console.log(`  複雜度：${analysis.complexity.toFixed(2)}/10`);
  console.log(`  模組化：${analysis.modularity.toFixed(2)}/10\n`);

  const requirements = '需要一個高可擴展的微服務架構，支持百萬級並發';
  const suggestion = await architect.suggestArchitecture(requirements);
  console.log('💡 架構建議：');
  console.log(suggestion);
}

async function coderExample() {
  console.log('💻 Fusion Coder - 代碼生成示例\n');

  const coder = new FusionCoder(process.env.ANTHROPIC_API_KEY);

  const description = '創建一個 LRU 緩存類，支持泛型，包含 get、set、delete 方法';
  const options = {
    language: 'typescript',
    style: 'oop' as const,
    includeTests: true,
    includeComments: false,
  };

  console.log(`📝 生成代碼：${description}\n`);
  const code = await coder.generateCode(description, options);
  console.log('✅ 生成完成：\n');
  console.log(code);
}

async function optimizerExample() {
  console.log('⚡ Fusion Optimizer - 性能優化示例\n');

  const optimizer = new FusionOptimizer();

  const sampleCode = `
function findDuplicates(arr1, arr2) {
  const result = [];
  for (const item1 of arr1) {
    for (const item2 of arr2) {
      if (item1.id === item2.id) {
        result.push(item1);
      }
    }
  }
  return result;
}
  `;

  console.log('🔍 分析性能瓶頸...\n');
  const metrics = await optimizer.analyzePerformance(sampleCode, 'javascript');
  
  const report = optimizer.generatePerformanceReport(metrics);
  console.log(report);
}

async function runAllExamples() {
  try {
    await basicExample();
    console.log('\n' + '='.repeat(80) + '\n');
    
    await architectureExample();
    console.log('\n' + '='.repeat(80) + '\n');
    
    await coderExample();
    console.log('\n' + '='.repeat(80) + '\n');
    
    await optimizerExample();
  } catch (error) {
    console.error('❌ 錯誤：', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllExamples();
}

export { basicExample, architectureExample, coderExample, optimizerExample };
