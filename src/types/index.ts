export interface FusionConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  learningMode: 'adaptive' | 'static' | 'hybrid';
  memoryStoragePath: string;
  securityLevel: 'low' | 'medium' | 'high' | 'critical';
  securityScanOnStart: boolean;
  optimizationLevel: 'conservative' | 'moderate' | 'aggressive';
  performanceProfiling: boolean;
  vectorDbProvider: 'pinecone' | 'weaviate' | 'local';
  pineconeApiKey?: string;
  pineconeEnvironment?: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFilePath: string;
  autoUpdate: boolean;
  telemetryEnabled: boolean;
}

export interface AnalysisResult {
  summary: string;
  architecture: ArchitectureAnalysis;
  codeQuality: CodeQualityMetrics;
  performance: PerformanceMetrics;
  security: SecurityAnalysis;
  recommendations: Recommendation[];
}

export interface ArchitectureAnalysis {
  pattern: string;
  layers: string[];
  dependencies: DependencyGraph;
  complexity: number;
  modularity: number;
}

export interface CodeQualityMetrics {
  maintainability: number;
  readability: number;
  testCoverage: number;
  duplication: number;
  codeSmells: CodeSmell[];
}

export interface PerformanceMetrics {
  timeComplexity: string;
  spaceComplexity: string;
  bottlenecks: Bottleneck[];
  optimizationOpportunities: OptimizationOpportunity[];
}

export interface SecurityAnalysis {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  complianceStatus: ComplianceStatus;
}

export interface Vulnerability {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  fix?: string;
}

export interface Recommendation {
  type: 'architecture' | 'performance' | 'security' | 'code-quality';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
  impact: string;
}

export interface DependencyGraph {
  nodes: string[];
  edges: Array<{ from: string; to: string; type: string }>;
}

export interface CodeSmell {
  type: string;
  location: string;
  description: string;
  suggestion: string;
}

export interface Bottleneck {
  location: string;
  type: 'cpu' | 'memory' | 'io' | 'network';
  impact: number;
  description: string;
}

export interface OptimizationOpportunity {
  type: string;
  location: string;
  currentComplexity: string;
  targetComplexity: string;
  expectedImprovement: string;
  implementation: string;
}

export interface ComplianceStatus {
  standard: string;
  compliant: boolean;
  issues: string[];
}

export interface LearningData {
  projectId: string;
  codeStyle: CodeStyle;
  patterns: Pattern[];
  preferences: Preferences;
  history: HistoryEntry[];
}

export interface CodeStyle {
  indentation: string;
  quotes: 'single' | 'double';
  semicolons: boolean;
  naming: NamingConventions;
}

export interface NamingConventions {
  variables: string;
  functions: string;
  classes: string;
  constants: string;
}

export interface Pattern {
  name: string;
  frequency: number;
  context: string;
}

export interface Preferences {
  frameworks: string[];
  libraries: string[];
  designPatterns: string[];
  testingFrameworks: string[];
}

export interface HistoryEntry {
  timestamp: number;
  action: string;
  context: string;
  result: string;
}

export interface DeploymentConfig {
  target: 'aws' | 'azure' | 'gcp' | 'vercel' | 'netlify';
  environment: 'development' | 'staging' | 'production';
  containerize: boolean;
  ci: boolean;
  monitoring: boolean;
}

export interface TestGenerationOptions {
  type: 'unit' | 'integration' | 'e2e';
  framework: 'jest' | 'vitest' | 'mocha' | 'playwright' | 'cypress';
  coverage: number;
}

export interface RefactorOptions {
  applyPatterns: boolean;
  splitFunctions: boolean;
  removeCodeSmells: boolean;
  improveNaming: boolean;
}

export interface DocumentationOptions {
  type: 'api' | 'readme' | 'architecture' | 'guide';
  format: 'markdown' | 'html' | 'pdf';
  includeExamples: boolean;
}
