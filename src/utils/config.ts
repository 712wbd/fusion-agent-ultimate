import { config as dotenvConfig } from 'dotenv';
import { join } from 'path';
import { existsSync } from 'fs';
import type { FusionConfig } from '@types/index';
import { logger } from './logger';

dotenvConfig();

export async function loadConfig(): Promise<FusionConfig> {
  const envPath = join(process.cwd(), '.env');
  
  if (!existsSync(envPath)) {
    logger.warn('⚠️ .env 文件不存在，使用默認配置');
  }

  const config: FusionConfig = {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    learningMode: (process.env.LEARNING_MODE as any) || 'adaptive',
    memoryStoragePath: process.env.MEMORY_STORAGE_PATH || './data/memory',
    securityLevel: (process.env.SECURITY_LEVEL as any) || 'high',
    securityScanOnStart: process.env.SECURITY_SCAN_ON_START === 'true',
    optimizationLevel: (process.env.OPTIMIZATION_LEVEL as any) || 'aggressive',
    performanceProfiling: process.env.PERFORMANCE_PROFILING === 'true',
    vectorDbProvider: (process.env.VECTOR_DB_PROVIDER as any) || 'local',
    pineconeApiKey: process.env.PINECONE_API_KEY,
    pineconeEnvironment: process.env.PINECONE_ENVIRONMENT,
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    logFilePath: process.env.LOG_FILE_PATH || './logs/fusion-agent.log',
    autoUpdate: process.env.AUTO_UPDATE === 'true',
    telemetryEnabled: process.env.TELEMETRY_ENABLED === 'true',
  };

  if (!config.anthropicApiKey && !config.openaiApiKey) {
    logger.error('❌ 錯誤：未配置 AI Provider API Key');
    logger.info('請在 .env 文件中設置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY');
    throw new Error('Missing AI Provider API Key');
  }

  return config;
}

export function validateConfig(config: FusionConfig): boolean {
  if (!config.anthropicApiKey && !config.openaiApiKey) {
    return false;
  }
  return true;
}
