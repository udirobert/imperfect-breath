#!/usr/bin/env node

/**
 * Security Audit Script
 * 
 * Script to audit the codebase for security issues including:
 * - Exposed secrets
 * - Insecure code patterns
 * - Missing security headers
 * - Vulnerable dependencies
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Patterns to search for exposed secrets
  SECRET_PATTERNS: [
    { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{20,}/ },
    { name: 'Anthropic API Key', pattern: /sk-ant-[a-zA-Z0-9-_]{20,}/ },
    { name: 'Google/Gemini API Key', pattern: /AIza[a-zA-Z0-9_-]{35}/ },
    { name: 'Private Key', pattern: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
    { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
    { name: 'JWT Secret', pattern: /jwt\.secret|JWT_SECRET/i },
    { name: 'Database URL', pattern: /:\/\/[^:]+:[^@]+@/ }
  ],
  
  // File extensions to scan
  FILE_EXTENSIONS: ['.js', '.ts', '.jsx', '.tsx', '.py', '.md', '.json', '.env'],
  
  // Directories to exclude
  EXCLUDE_DIRS: ['node_modules', '.git', 'dist', 'build', '.next'],
  
  // Security headers to check for
  SECURITY_HEADERS: [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection',
    'Strict-Transport-Security',
    'Content-Security-Policy',
    'Referrer-Policy'
  ]
};

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
  }
  
  /**
   * Check for exposed secrets in files
   */
  checkForExposedSecrets() {
    console.log('🔍 Checking for exposed secrets...');
    
    const files = this.getAllFiles('.');
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        for (const { name, pattern } of CONFIG.SECRET_PATTERNS) {
          if (pattern.test(content)) {
            const matches = content.match(new RegExp(pattern, 'g'));
            if (matches) {
              this.issues.push({
                type: 'EXPOSED_SECRET',
                file,
                issue: `${name} found in file`,
                severity: 'HIGH',
                matches: matches.length
              });
            }
          }
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }
  
  /**
   * Check for insecure code patterns
   */
  checkForInsecurePatterns() {
    console.log('🔍 Checking for insecure code patterns...');
    
    const files = this.getAllFiles('.');
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for eval usage
        if (/\beval\s*\(/.test(content)) {
          this.warnings.push({
            type: 'INSECURE_PATTERN',
            file,
            issue: 'eval() usage detected',
            severity: 'MEDIUM'
          });
        }
        
        // Check for innerHTML usage
        if (/\.innerHTML\s*=/.test(content)) {
          this.warnings.push({
            type: 'INSECURE_PATTERN',
            file,
            issue: 'innerHTML assignment detected (potential XSS)',
            severity: 'MEDIUM'
          });
        }
        
        // Check for document.write usage
        if (/document\.write/.test(content)) {
          this.warnings.push({
            type: 'INSECURE_PATTERN',
            file,
            issue: 'document.write() usage detected',
            severity: 'MEDIUM'
          });
        }
        
        // Check for dangerouslySetInnerHTML usage without sanitization
        if (/dangerouslySetInnerHTML/.test(content) && !/sanitize/.test(content)) {
          this.warnings.push({
            type: 'INSECURE_PATTERN',
            file,
            issue: 'dangerouslySetInnerHTML without sanitization',
            severity: 'MEDIUM'
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }
  
  /**
   * Check for missing security headers
   */
  checkForMissingSecurityHeaders() {
    console.log('🔍 Checking for missing security headers...');
    
    // Check if security headers are set in API responses
    const apiFiles = this.getAllFiles('.').filter(file => 
      file.includes('/api/') && (file.endsWith('.ts') || file.endsWith('.js'))
    );
    
    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check if security headers are being set
        const hasSecurityHeaders = CONFIG.SECURITY_HEADERS.some(header => 
          content.includes(header)
        );
        
        if (!hasSecurityHeaders) {
          this.warnings.push({
            type: 'MISSING_HEADERS',
            file,
            issue: 'Missing security headers in API response',
            severity: 'MEDIUM'
          });
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
  }
  
  /**
   * Check for vulnerable dependencies
   */
  checkForVulnerableDependencies() {
    console.log('🔍 Checking for vulnerable dependencies...');
    
    try {
      // Run npm audit
      const result = execSync('npm audit --audit-level=moderate', { 
        encoding: 'utf8', 
        stdio: ['pipe', 'pipe', 'ignore'] 
      });
      
      if (result.includes('found') && result.includes('vulnerabilities')) {
        this.warnings.push({
          type: 'VULNERABLE_DEPENDENCIES',
          file: 'package.json',
          issue: 'Vulnerable dependencies found. Run "npm audit" for details.',
          severity: 'HIGH'
        });
      }
    } catch (error) {
      // npm audit exits with code 1 when vulnerabilities are found
      if (error.status === 1) {
        this.warnings.push({
          type: 'VULNERABLE_DEPENDENCIES',
          file: 'package.json',
          issue: 'Vulnerable dependencies found. Run "npm audit" for details.',
          severity: 'HIGH'
        });
      }
    }
  }
  
  /**
   * Get all files recursively
   */
  getAllFiles(dirPath) {
    let results = [];
    
    try {
      const list = fs.readdirSync(dirPath);
      
      list.forEach((file) => {
        file = path.resolve(dirPath, file);
        
        const stat = fs.statSync(file);
        
        if (stat && stat.isDirectory()) {
          // Skip excluded directories
          if (!CONFIG.EXCLUDE_DIRS.some(exclude => file.includes(exclude))) {
            results = [...results, ...this.getAllFiles(file)];
          }
        } else {
          // Check file extension
          const ext = path.extname(file);
          if (CONFIG.FILE_EXTENSIONS.includes(ext)) {
            results.push(file);
          }
        }
      });
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return results;
  }
  
  /**
   * Run the security audit
   */
  runAudit() {
    console.log('🔒 Security Audit for Imperfect Breath');
    console.log('=====================================');
    
    // Run all checks
    this.checkForExposedSecrets();
    this.checkForInsecurePatterns();
    this.checkForMissingSecurityHeaders();
    this.checkForVulnerableDependencies();
    
    // Display results
    this.displayResults();
    
    // Return exit code
    return this.issues.length > 0 ? 1 : 0;
  }
  
  /**
   * Display audit results
   */
  displayResults() {
    console.log('\n📊 Security Audit Results');
    console.log('========================');
    
    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('✅ No security issues found!');
      return;
    }
    
    // Display high severity issues
    if (this.issues.length > 0) {
      console.log('\n🚨 High Severity Issues:');
      this.issues.forEach(issue => {
        console.log(`  ❌ ${issue.issue} in ${issue.file}`);
        if (issue.matches) {
          console.log(`     Found ${issue.matches} occurrence(s)`);
        }
      });
    }
    
    // Display medium severity warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Medium Severity Warnings:');
      this.warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning.issue} in ${warning.file}`);
      });
    }
    
    // Summary
    console.log(`\n📋 Summary:`);
    console.log(`  High Severity: ${this.issues.length}`);
    console.log(`  Medium Severity: ${this.warnings.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🔧 Action Required:');
      console.log('  Please fix the high severity issues before deploying.');
    }
  }
}

// Run the audit if this script is executed directly
if (require.main === module) {
  const auditor = new SecurityAuditor();
  const exitCode = auditor.runAudit();
  process.exit(exitCode);
}

module.exports = { SecurityAuditor };