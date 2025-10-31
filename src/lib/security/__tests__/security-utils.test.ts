/**
 * Security Utilities Tests
 * 
 * Tests for the security enhancement utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SecurityManager,
  validateAndSanitizeInput,
  generateCSRFToken,
  validateCSRFToken,
  checkRateLimit,
  generateSessionId,
  hashPassword,
  generateSecureRandomString,
  validateJWT,
  sanitizeObject,
  getSecurityHeaders,
  getContentSecurityPolicy,
  validateAPIRequest,
  sanitizeAPIResponse
} from '../security/security-utils';

describe('Security Utilities', () => {
  let securityManager: SecurityManager;
  
  beforeEach(() => {
    securityManager = SecurityManager.getInstance();
    // Clear rate limit store before each test
    vi.resetModules();
  });
  
  describe('Input Validation and Sanitization', () => {
    it('should validate and sanitize email input', () => {
      const result = validateAndSanitizeInput('test@example.com', 'email');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('test@example.com');
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid email input', () => {
      const result = validateAndSanitizeInput('invalid-email', 'email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
    
    it('should validate and sanitize URL input', () => {
      const result = validateAndSanitizeInput('https://example.com', 'url');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('https://example.com');
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid URL input', () => {
      const result = validateAndSanitizeInput('invalid-url', 'url');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid URL format');
    });
    
    it('should validate and sanitize username input', () => {
      const result = validateAndSanitizeInput('test_user', 'username');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedValue).toBe('test_user');
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid username input', () => {
      const result = validateAndSanitizeInput('test user with spaces', 'username');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Username can only contain letters, numbers, hyphens, and underscores');
    });
  });
  
  describe('CSRF Protection', () => {
    it('should generate CSRF token', () => {
      const token = generateCSRFToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
    
    it('should validate valid CSRF token', () => {
      const token = generateCSRFToken();
      const isValid = validateCSRFToken(token, token);
      expect(isValid).toBe(true);
    });
    
    it('should reject invalid CSRF token', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();
      const isValid = validateCSRFToken(token1, token2);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'test-identifier';
      const isAllowed = checkRateLimit(identifier);
      expect(isAllowed).toBe(true);
    });
    
    it('should block requests exceeding rate limit', () => {
      const identifier = 'test-identifier-rate-limit';
      
      // Allow first 100 requests
      for (let i = 0; i < 100; i++) {
        const isAllowed = checkRateLimit(identifier);
        expect(isAllowed).toBe(true);
      }
      
      // Block subsequent requests
      const isAllowed = checkRateLimit(identifier);
      expect(isAllowed).toBe(false);
    });
  });
  
  describe('Session Management', () => {
    it('should generate session ID', () => {
      const sessionId = generateSessionId();
      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('string');
      expect(sessionId.length).toBeGreaterThan(0);
    });
  });
  
  describe('Password Security', () => {
    it('should hash password', async () => {
      const password = 'test-password';
      const hashed = await hashPassword(password);
      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBe(64); // SHA-256 hex string
    });
  });
  
  describe('Random String Generation', () => {
    it('should generate secure random string', () => {
      const randomString = generateSecureRandomString();
      expect(randomString).toBeDefined();
      expect(typeof randomString).toBe('string');
      expect(randomString.length).toBe(64); // 32 bytes * 2 hex chars per byte
    });
    
    it('should generate random string with specified length', () => {
      const randomString = generateSecureRandomString(16);
      expect(randomString.length).toBe(32); // 16 bytes * 2 hex chars per byte
    });
  });
  
  describe('JWT Validation', () => {
    it('should validate valid JWT token', () => {
      // Valid JWT format (header.payload.signature)
      const validJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const isValid = validateJWT(validJWT);
      expect(isValid).toBe(true);
    });
    
    it('should reject invalid JWT token', () => {
      const invalidJWT = 'invalid-jwt-token';
      const isValid = validateJWT(invalidJWT);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Object Sanitization', () => {
    it('should sanitize object properties', () => {
      const obj = {
        name: 'Test User',
        email: 'test@example.com',
        bio: '<script>alert("xss")</script>Safe bio',
        age: '25'
      };
      
      const sanitizers = {
        name: 'text',
        email: 'email',
        bio: 'html',
        age: 'integer'
      };
      
      const sanitized = sanitizeObject(obj, sanitizers);
      expect(sanitized.name).toBe('Test User');
      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.bio).not.toContain('<script>');
      expect(sanitized.age).toBe(25);
    });
  });
  
  describe('Security Headers', () => {
    it('should return security headers', () => {
      const headers = getSecurityHeaders();
      expect(headers).toBeDefined();
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    });
    
    it('should return Content Security Policy', () => {
      const csp = getContentSecurityPolicy();
      expect(csp).toBeDefined();
      expect(typeof csp).toBe('string');
      expect(csp).toContain('default-src \'self\'');
    });
  });
  
  describe('API Request Validation', () => {
    it('should validate valid API request', () => {
      const request = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        }
      };
      
      const result = validateAPIRequest(request);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject dangerous HTTP methods', () => {
      const request = {
        method: 'TRACE',
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      const result = validateAPIRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dangerous HTTP method: TRACE');
    });
    
    it('should reject header injection attempts', () => {
      const request = {
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: {
          'Content-Type': 'application/json\r\nX-Injected: malicious'
        }
      };
      
      const result = validateAPIRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Header injection attempt in Content-Type');
    });
  });
  
  describe('API Response Sanitization', () => {
    it('should sanitize API response data', () => {
      const data = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          bio: '<script>alert("xss")</script>Safe bio'
        },
        posts: [
          {
            title: 'Test Post',
            content: '<img src="x" onerror="alert(\'xss\')">'
          }
        ]
      };
      
      const sanitized = sanitizeAPIResponse(data);
      expect(sanitized.user.name).toBe('Test User');
      expect(sanitized.user.email).toBe('test@example.com');
      expect(sanitized.user.bio).not.toContain('<script>');
      expect(sanitized.posts[0].content).not.toContain('onerror');
    });
    
    it('should handle circular references', () => {
      const data: any = { name: 'Test' };
      data.self = data; // Circular reference
      
      const sanitized = sanitizeAPIResponse(data);
      expect(sanitized.name).toBe('Test');
      expect(sanitized.self).toBe('[Circular]');
    });
  });
});