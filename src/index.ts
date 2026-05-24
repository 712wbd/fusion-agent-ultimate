import { FusionMasterAgent } from '@agents/FusionMasterAgent';
import { logger } from '@utils/logger';
import { loadConfig } from '@utils/config';
import { Command } from 'commander';
import chalk from 'chalk';

const program = new Command();

program
  .name('fusion-agent')
  .description('🌟 Fusion Agent Ultimate - 世界頂級融合智能體插件')
  .version('1.0.0');

program
  .command('activate')
  .description('啟動 Fusion Agent')
  .action(async () => {
    try {
      logger.info(chalk.green('🌟 正在啟動 Fusion Agent Ultimate...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      logger.info(chalk.green('✅ Fusion Agent 已成功啟動！'));
    } catch (error) {
      logger.error(chalk.red('❌ 啟動失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('智能分析項目')
  .option('-p, --path <path>', '項目路徑', process.cwd())
  .option('-d, --deep', '深度分析', false)
  .action(async (options) => {
    try {
      logger.info(chalk.blue('🔍 開始分析項目...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.analyzeProject(options.path, options.deep);
      logger.info(chalk.green('✅ 分析完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 分析失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('optimize')
  .description('全面優化項目')
  .option('-p, --path <path>', '項目路徑', process.cwd())
  .option('-t, --type <type>', '優化類型 (performance|security|code)', 'all')
  .action(async (options) => {
    try {
      logger.info(chalk.yellow('⚡ 開始優化項目...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.optimize(options.path, options.type);
      logger.info(chalk.green('✅ 優化完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 優化失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('secure')
  .description('安全掃描')
  .option('-p, --path <path>', '項目路徑', process.cwd())
  .option('-f, --fix', '自動修復', false)
  .action(async (options) => {
    try {
      logger.info(chalk.red('🔒 開始安全掃描...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.securityScan(options.path, options.fix);
      logger.info(chalk.green('✅ 掃描完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 掃描失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('deploy')
  .description('一鍵部署')
  .option('-p, --path <path>', '項目路徑', process.cwd())
  .option('-t, --target <target>', '部署目標 (aws|azure|gcp|vercel)', 'vercel')
  .action(async (options) => {
    try {
      logger.info(chalk.magenta('🚀 開始部署...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.deploy(options.path, options.target);
      logger.info(chalk.green('✅ 部署完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 部署失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('learn')
  .description('學習模式 - 從項目中學習')
  .option('-p, --path <path>', '項目路徑', process.cwd())
  .action(async (options) => {
    try {
      logger.info(chalk.cyan('🧠 進入學習模式...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.learn(options.path);
      logger.info(chalk.green('✅ 學習完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 學習失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('review')
  .description('代碼審查')
  .option('-p, --path <path>', '文件路徑', '')
  .option('-a, --auto-fix', '自動修復', false)
  .action(async (options) => {
    try {
      logger.info(chalk.blue('👀 開始代碼審查...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.review(options.path, options.autoFix);
      logger.info(chalk.green('✅ 審查完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 審查失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('test')
  .description('生成測試用例')
  .option('-p, --path <path>', '文件路徑', '')
  .option('-t, --type <type>', '測試類型 (unit|integration|e2e)', 'unit')
  .action(async (options) => {
    try {
      logger.info(chalk.green('🧪 開始生成測試...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.generateTests(options.path, options.type);
      logger.info(chalk.green('✅ 測試生成完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 生成失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('refactor')
  .description('智能重構代碼')
  .option('-p, --path <path>', '文件路徑', '')
  .action(async (options) => {
    try {
      logger.info(chalk.yellow('♻️ 開始重構代碼...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.refactor(options.path);
      logger.info(chalk.green('✅ 重構完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 重構失敗：'), error);
      process.exit(1);
    }
  });

program
  .command('document')
  .description('生成文檔')
  .option('-p, --path <path>', '項目路徑', process.cwd())
  .option('-t, --type <type>', '文檔類型 (api|readme|architecture)', 'readme')
  .action(async (options) => {
    try {
      logger.info(chalk.blue('📚 開始生成文檔...'));
      const config = await loadConfig();
      const agent = new FusionMasterAgent(config);
      await agent.initialize();
      const result = await agent.generateDocs(options.path, options.type);
      logger.info(chalk.green('✅ 文檔生成完成！'));
      console.log(result);
    } catch (error) {
      logger.error(chalk.red('❌ 生成失敗：'), error);
      process.exit(1);
    }
  });

program.parse();

export { FusionMasterAgent };
export * from '@agents/FusionMasterAgent';
export * from '@skills/FusionArchitect';
export * from '@skills/FusionCoder';
export * from '@skills/FusionOptimizer';
export * from '@skills/FusionSecurity';
export * from '@skills/FusionTester';
export * from '@skills/FusionDevOps';
export * from '@skills/FusionLearner';
export * from '@skills/FusionAssistant';
