import { logger } from '@utils/logger';

interface SecurityScanResult {
  vulnerabilities: Vulnerability[];
  riskScore: number;
  securityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  compliance: ComplianceStatus[];
  recommendations: string[];
}

interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  location: string;
  description: string;
  impact: string;
  cwe: string;
  owasp: string;
  exploit: string;
  remediation: string;
  cveReference?: string;
}

type VulnerabilityType =
  | 'injection'
  | 'authentication'
  | 'xss'
  | 'csrf'
  | 'sensitive-data'
  | 'xxe'
  | 'deserialization'
  | 'dependencies'
  | 'logging'
  | 'crypto';

interface ComplianceStatus {
  standard: 'OWASP Top 10' | 'CWE Top 25' | 'GDPR' | 'PCI-DSS' | 'SOC 2';
  compliant: boolean;
  issues: string[];
}

export class FusionSecurityScanner {
  private vulnerabilityPatterns: Map<VulnerabilityType, RegExp[]> = new Map();

  constructor() {
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.vulnerabilityPatterns.set('injection', [
      /eval\s*\(/gi,
      /new\s+Function\s*\(/gi,
      /exec\s*\([^)]*\$\{/gi,
      /query\s*\([^)]*\+/gi,
      /\.innerHTML\s*=\s*.*\+/gi,
    ]);

    this.vulnerabilityPatterns.set('authentication', [
      /password\s*===?\s*['"][^'"]+['"]/gi,
      /token\s*===?\s*['"][^'"]+['"]/gi,
      /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
      /\.password\s*=\s*req\.body/gi,
    ]);

    this.vulnerabilityPatterns.set('sensitive-data', [
      /password\s*=\s*/gi,
      /api[_-]?key\s*=\s*/gi,
      /secret\s*=\s*/gi,
      /private[_-]?key\s*=\s*/gi,
      /console\.log\([^)]*password/gi,
    ]);

    this.vulnerabilityPatterns.set('xss', [
      /dangerouslySetInnerHTML/gi,
      /\.innerHTML\s*=/gi,
      /document\.write\(/gi,
      /v-html\s*=/gi,
    ]);

    this.vulnerabilityPatterns.set('crypto', [
      /md5\(/gi,
      /sha1\(/gi,
      /Math\.random\(\)/gi,
      /new\s+Date\(\)\.getTime\(\)/gi,
    ]);
  }

  async scanCode(code: string, language: string): Promise<SecurityScanResult> {
    logger.info('🔒 Fusion Security Scanner 開始深度安全掃描...');

    const vulnerabilities = this.detectVulnerabilities(code, language);
    const riskScore = this.calculateRiskScore(vulnerabilities);
    const securityGrade = this.determineSecurityGrade(riskScore);
    const compliance = this.assessCompliance(vulnerabilities);
    const recommendations = this.generateSecurityRecommendations(vulnerabilities);

    logger.info(`✅ 安全掃描完成，風險評分：${riskScore}/100，等級：${securityGrade}`);

    return {
      vulnerabilities,
      riskScore,
      securityGrade,
      compliance,
      recommendations,
    };
  }

  private detectVulnerabilities(code: string, language: string): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    let vulnId = 1;

    const sqlInjection = code.match(/query\s*\([^)]*['"`]\s*\+\s*/gi);
    if (sqlInjection) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'injection',
        severity: 'critical',
        location: 'SQL 查詢語句',
        description: `檢測到 ${sqlInjection.length} 處潛在的 SQL 注入漏洞`,
        impact: '攻擊者可能獲取、修改或刪除數據庫中的所有數據，導致數據洩露或完全破壞',
        cwe: 'CWE-89: SQL Injection',
        owasp: 'A03:2021 – Injection',
        exploit: `攻擊示例：username = "admin'--" 可繞過身份驗證`,
        remediation: `使用參數化查詢（Prepared Statements）或 ORM：
  
// ❌ 不安全
const query = "SELECT * FROM users WHERE username = '" + username + "'";

// ✅ 安全
const query = "SELECT * FROM users WHERE username = ?";
db.execute(query, [username]);

// ✅ 使用 ORM (Sequelize/Prisma)
await User.findOne({ where: { username } });`,
        cveReference: 'CVE-2021-44228 (類似案例)',
      });
    }

    const evalUsage = code.match(/eval\s*\(/gi);
    if (evalUsage) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'injection',
        severity: 'critical',
        location: 'eval() 函數調用',
        description: `發現 ${evalUsage.length} 處使用 eval()，這是極其危險的做法`,
        impact: '攻擊者可執行任意 JavaScript 代碼，完全控制應用程序',
        cwe: 'CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code',
        owasp: 'A03:2021 – Injection',
        exploit: `eval(userInput) 其中 userInput = "require('child_process').exec('rm -rf /')"`,
        remediation: `絕對不要使用 eval()。替代方案：

// ❌ 極度危險
eval(userInput);

// ✅ 使用 JSON.parse (僅限 JSON)
JSON.parse(userInput);

// ✅ 使用 Function constructor with strict validation
new Function('return ' + sanitizedInput)();

// ✅ 最佳：重新設計邏輯，避免動態代碼執行`,
      });
    }

    const xssVulnerability = code.match(/\.innerHTML\s*=\s*(?!['"`])/gi);
    if (xssVulnerability) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'xss',
        severity: 'high',
        location: 'innerHTML 賦值',
        description: `檢測到 ${xssVulnerability.length} 處 XSS (跨站腳本攻擊) 風險`,
        impact: '攻擊者可以注入惡意腳本，竊取用戶 Cookie、Session Token 或執行釣魚攻擊',
        cwe: 'CWE-79: Cross-site Scripting (XSS)',
        owasp: 'A03:2021 – Injection',
        exploit: `element.innerHTML = userInput 其中 userInput = "<img src=x onerror='alert(document.cookie)'>"`,
        remediation: `使用安全的 API 或進行 HTML 轉義：

// ❌ 不安全
element.innerHTML = userInput;

// ✅ 使用 textContent (僅純文本)
element.textContent = userInput;

// ✅ 使用 DOMPurify 清理 HTML
element.innerHTML = DOMPurify.sanitize(userInput);

// ✅ React (自動轉義)
<div>{userInput}</div>`,
      });
    }

    const hardcodedCredentials = code.match(
      /(?:password|api[_-]?key|secret|token)\s*[:=]\s*['"][a-zA-Z0-9!@#$%^&*]{8,}['"]/gi
    );
    if (hardcodedCredentials) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'sensitive-data',
        severity: 'critical',
        location: '硬編碼憑證',
        description: `發現 ${hardcodedCredentials.length} 處硬編碼的敏感信息（密碼/密鑰）`,
        impact: '攻擊者可以從代碼庫中直接獲取憑證，導致系統被完全入侵',
        cwe: 'CWE-798: Use of Hard-coded Credentials',
        owasp: 'A07:2021 – Identification and Authentication Failures',
        exploit: `源代碼洩露後，攻擊者可直接使用這些憑證訪問系統`,
        remediation: `使用環境變量或密鑰管理服務：

// ❌ 絕對不要這樣做
const apiKey = "sk-1234567890abcdef";
const password = "MyP@ssw0rd123";

// ✅ 使用環境變量
const apiKey = process.env.API_KEY;
const password = process.env.DB_PASSWORD;

// ✅ 使用密鑰管理服務 (AWS Secrets Manager / HashiCorp Vault)
const apiKey = await secretsManager.getSecretValue('api-key');`,
      });
    }

    const weakCrypto = code.match(/md5\(|sha1\(/gi);
    if (weakCrypto) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'crypto',
        severity: 'high',
        location: '弱加密算法',
        description: `使用了 ${weakCrypto.length} 處過時的加密算法 (MD5/SHA1)`,
        impact: '這些算法已被證明不安全，攻擊者可以通過彩虹表或碰撞攻擊破解密碼',
        cwe: 'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
        owasp: 'A02:2021 – Cryptographic Failures',
        exploit: `MD5 已被證明存在碰撞攻擊，2017 年 Google 成功演示了 SHA1 碰撞攻擊`,
        remediation: `使用現代加密算法：

// ❌ 不安全
const hash = md5(password);
const hash = sha1(password);

// ✅ 使用 bcrypt (密碼散列)
const hash = await bcrypt.hash(password, 12);

// ✅ 使用 SHA-256/SHA-512 (一般散列)
const hash = crypto.createHash('sha256').update(data).digest('hex');

// ✅ 使用 Argon2 (最新推薦)
const hash = await argon2.hash(password);`,
      });
    }

    const insecureRandom = code.match(/Math\.random\(\)/gi);
    if (insecureRandom) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'crypto',
        severity: 'medium',
        location: 'Math.random()',
        description: `使用了 ${insecureRandom.length} 處不安全的隨機數生成器`,
        impact: 'Math.random() 不適合用於安全相關場景（Token、Session ID），可被預測',
        cwe: 'CWE-338: Use of Cryptographically Weak Pseudo-Random Number Generator',
        owasp: 'A02:2021 – Cryptographic Failures',
        exploit: `攻擊者可以通過時間種子預測隨機數序列`,
        remediation: `使用密碼學安全的隨機數生成器：

// ❌ 不安全（用於安全場景）
const token = Math.random().toString(36);

// ✅ 使用 crypto.randomBytes
const token = crypto.randomBytes(32).toString('hex');

// ✅ 使用 uuid
const sessionId = uuidv4();

// ✅ 使用 Web Crypto API (瀏覽器)
const array = new Uint32Array(1);
crypto.getRandomValues(array);`,
      });
    }

    const csrfVulnerable = !code.includes('csrf') && !code.includes('CSRF') && code.includes('app.post');
    if (csrfVulnerable) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'csrf',
        severity: 'high',
        location: 'POST 端點',
        description: `未檢測到 CSRF 保護機制`,
        impact: '攻擊者可以誘導用戶執行非預期的操作（轉賬、修改密碼等）',
        cwe: 'CWE-352: Cross-Site Request Forgery (CSRF)',
        owasp: 'A01:2021 – Broken Access Control',
        exploit: `攻擊者創建惡意頁面：<form action="https://victim.com/transfer" method="POST">...</form>`,
        remediation: `實現 CSRF Token 保護：

// ✅ 使用 csurf 中間件 (Express)
const csrf = require('csurf');
app.use(csrf({ cookie: true }));

// ✅ 使用 SameSite Cookie
res.cookie('session', sessionId, { sameSite: 'strict' });

// ✅ 驗證 Origin/Referer 頭
if (req.headers.origin !== allowedOrigin) {
  return res.status(403).send('Forbidden');
}`,
      });
    }

    const sensitiveLogging = code.match(/console\.log\([^)]*(?:password|token|secret|key)/gi);
    if (sensitiveLogging) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'logging',
        severity: 'medium',
        location: '日誌記錄',
        description: `發現 ${sensitiveLogging.length} 處敏感信息記錄到日誌`,
        impact: '敏感信息可能通過日誌洩露給運維人員、第三方監控服務或攻擊者',
        cwe: 'CWE-532: Insertion of Sensitive Information into Log File',
        owasp: 'A09:2021 – Security Logging and Monitoring Failures',
        exploit: `日誌文件被訪問後，攻擊者可直接獲取用戶密碼或 API 密鑰`,
        remediation: `過濾敏感信息或使用安全的日誌庫：

// ❌ 危險
console.log('User login:', { username, password });
logger.info('API request', { headers });

// ✅ 過濾敏感字段
console.log('User login:', { username, password: '***' });

// ✅ 使用 Winston 配置過濾器
const logger = winston.createLogger({
  format: winston.format.combine(
    redactSensitiveData(['password', 'token', 'apiKey']),
    winston.format.json()
  )
});`,
      });
    }

    const xxeVulnerable = code.match(/DOMParser|parseXML|xml2js/gi) && !code.includes('noent: false');
    if (xxeVulnerable) {
      vulnerabilities.push({
        id: `VULN-${String(vulnId++).padStart(3, '0')}`,
        type: 'xxe',
        severity: 'high',
        location: 'XML 解析',
        description: `XML 解析器可能存在 XXE (XML 外部實體注入) 漏洞`,
        impact: '攻擊者可以讀取服務器文件、執行 SSRF 攻擊或發起 DoS 攻擊',
        cwe: 'CWE-611: Improper Restriction of XML External Entity Reference',
        owasp: 'A05:2021 – Security Misconfiguration',
        exploit: `惡意 XML：<!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><data>&xxe;</data>`,
        remediation: `禁用 XML 外部實體：

// ✅ xml2js (Node.js)
xml2js.parseString(xml, { 
  explicitRoot: false,
  explicitArray: false,
  ignoreAttrs: true,
  // 禁用外部實體
  xmlns: false
});

// ✅ libxmljs
const doc = libxmljs.parseXml(xml, { noent: false, nonet: true });`,
      });
    }

    return vulnerabilities.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private calculateRiskScore(vulnerabilities: Vulnerability[]): number {
    let score = 0;

    const severityScores = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
      info: 1,
    };

    for (const vuln of vulnerabilities) {
      score += severityScores[vuln.severity];
    }

    return Math.min(score, 100);
  }

  private determineSecurityGrade(riskScore: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (riskScore === 0) return 'A+';
    if (riskScore <= 10) return 'A';
    if (riskScore <= 25) return 'B';
    if (riskScore <= 50) return 'C';
    if (riskScore <= 75) return 'D';
    return 'F';
  }

  private assessCompliance(vulnerabilities: Vulnerability[]): ComplianceStatus[] {
    const compliance: ComplianceStatus[] = [];

    const owaspIssues = vulnerabilities
      .filter(v => v.owasp.startsWith('A'))
      .map(v => `${v.owasp}: ${v.type}`);

    compliance.push({
      standard: 'OWASP Top 10',
      compliant: owaspIssues.length === 0,
      issues: owaspIssues,
    });

    const cweIssues = vulnerabilities.map(v => v.cwe);

    compliance.push({
      standard: 'CWE Top 25',
      compliant: cweIssues.length === 0,
      issues: cweIssues,
    });

    const gdprIssues = vulnerabilities.filter(v => v.type === 'sensitive-data' || v.type === 'logging');

    compliance.push({
      standard: 'GDPR',
      compliant: gdprIssues.length === 0,
      issues: gdprIssues.map(v => `數據保護違規: ${v.description}`),
    });

    return compliance;
  }

  private generateSecurityRecommendations(vulnerabilities: Vulnerability[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;

    if (criticalCount > 0) {
      recommendations.push(
        `🚨 **立即處理 ${criticalCount} 個嚴重漏洞**`,
        `   這些漏洞可能導致系統被完全入侵，需要在 24 小時內修復`
      );
    }

    if (highCount > 0) {
      recommendations.push(
        `⚠️ **優先修復 ${highCount} 個高危漏洞**`,
        `   建議在 1 週內完成修復`
      );
    }

    recommendations.push(
      `🔐 **實施安全開發實踐**`,
      `   - 輸入驗證：驗證所有用戶輸入`,
      `   - 輸出編碼：防止 XSS 攻擊`,
      `   - 參數化查詢：防止 SQL 注入`,
      `   - 使用安全的加密算法`,
      ``,
      `🧪 **定期進行安全測試**`,
      `   - 靜態代碼分析 (SAST): SonarQube, Checkmarx`,
      `   - 動態應用安全測試 (DAST): OWASP ZAP, Burp Suite`,
      `   - 依賴掃描: Snyk, npm audit`,
      `   - 滲透測試: 每季度進行一次`,
      ``,
      `📚 **安全培訓**`,
      `   - 開發團隊需要接受 OWASP Top 10 培訓`,
      `   - 了解常見攻擊手法和防禦措施`,
      ``,
      `🔄 **建立安全流程**`,
      `   - 代碼審查：所有代碼都應經過安全審查`,
      `   - CI/CD 集成：在構建流程中自動運行安全掃描`,
      `   - 漏洞響應計劃：制定應急響應流程`
    );

    return recommendations;
  }

  generateSecurityReport(result: SecurityScanResult): string {
    let report = '\n';
    report += '╔════════════════════════════════════════════════════════════╗\n';
    report += '║      🔒 Fusion Security Scanner - 安全掃描報告           ║\n';
    report += '╚════════════════════════════════════════════════════════════╝\n\n';

    const gradeEmoji = {
      'A+': '🏆',
      A: '✅',
      B: '👍',
      C: '⚠️',
      D: '🚨',
      F: '💀',
    }[result.securityGrade];

    report += `📊 **安全等級**: ${gradeEmoji} ${result.securityGrade} (風險評分: ${result.riskScore}/100)\n\n`;

    if (result.vulnerabilities.length === 0) {
      report += '🎉 **恭喜！未發現安全漏洞**\n\n';
    } else {
      report += `🔍 **發現 ${result.vulnerabilities.length} 個安全問題**\n\n`;

      const severityCounts = {
        critical: result.vulnerabilities.filter(v => v.severity === 'critical').length,
        high: result.vulnerabilities.filter(v => v.severity === 'high').length,
        medium: result.vulnerabilities.filter(v => v.severity === 'medium').length,
        low: result.vulnerabilities.filter(v => v.severity === 'low').length,
      };

      report += `- 🔴 嚴重: ${severityCounts.critical}\n`;
      report += `- 🟠 高危: ${severityCounts.high}\n`;
      report += `- 🟡 中危: ${severityCounts.medium}\n`;
      report += `- 🟢 低危: ${severityCounts.low}\n\n`;

      report += '### 🛡️ 漏洞詳情\n\n';

      result.vulnerabilities.forEach((vuln, index) => {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢',
          info: 'ℹ️',
        }[vuln.severity];

        report += `#### ${index + 1}. ${severityEmoji} [${vuln.id}] ${vuln.location}\n\n`;
        report += `**嚴重程度**: ${vuln.severity.toUpperCase()}\n\n`;
        report += `**描述**: ${vuln.description}\n\n`;
        report += `**影響**: ${vuln.impact}\n\n`;
        report += `**標準引用**: ${vuln.cwe} / ${vuln.owasp}\n\n`;
        report += `**攻擊示例**: \n\`\`\`\n${vuln.exploit}\n\`\`\`\n\n`;
        report += `**修復方案**: \n\`\`\`\n${vuln.remediation}\n\`\`\`\n\n`;
        if (vuln.cveReference) {
          report += `**CVE 參考**: ${vuln.cveReference}\n\n`;
        }
        report += '---\n\n';
      });
    }

    report += '### 📋 合規性檢查\n\n';
    result.compliance.forEach(comp => {
      const icon = comp.compliant ? '✅' : '❌';
      report += `${icon} **${comp.standard}**: ${comp.compliant ? '符合' : '不符合'}\n`;
      if (comp.issues.length > 0) {
        comp.issues.forEach(issue => {
          report += `   - ${issue}\n`;
        });
      }
      report += '\n';
    });

    report += '### 💡 安全建議\n\n';
    result.recommendations.forEach(rec => {
      report += `${rec}\n`;
    });

    report += '\n---\n\n';
    report += '*本報告由 Fusion Security Scanner 自動生成*\n';
    report += '*基於 OWASP Top 10 2021 和 CWE Top 25 標準*\n';

    return report;
  }
}

export default FusionSecurityScanner;
