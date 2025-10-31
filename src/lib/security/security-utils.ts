/**
 * Security Enhancement Utilities
 * 
 * Comprehensive security utilities for protecting the application against:
 * - XSS attacks
 * - CSRF attacks
 * - Data injection
 * - API security
 * - Authentication security
 * - Input validation and sanitization
 */

import { InputValidator } from './input-validator';
import { DataSanitizer } from './sanitizer';
import { SimpleCache } from './cache-utils';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  
  // Session security
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: true,
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https:"],
    fontSrc: ["'self'", "https:", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  },
  
  // Security headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https: data:; object-src 'none'; media-src 'self'; frame-src 'none';",
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },
};

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Security Manager Class
 * Centralized security management for the application
 */
export class SecurityManager {
  private static instance: SecurityManager;
  private cache: SimpleCache;
  
  private constructor() {
    this.cache = new SimpleCache(1000);
  }
  
  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }
  
  /**
   * Validate and sanitize user input
   * @param input User input to validate and sanitize
   * @param type Type of input
   * @param options Validation options
   * @returns Validated and sanitized input
   */
  validateAndSanitizeInput(
    input: string,
    type: 'email' | 'url' | 'text' | 'username' | 'apiKey' | 'address' | 'number' | 'breathingPatternName',
    options?: any
  ): { isValid: boolean; sanitizedValue: string; errors: string[] } {
    let validationResult;
    
    switch (type) {
      case 'email':
        validationResult = InputValidator.validateEmail(input);
        break;
      case 'url':
        validationResult = InputValidator.validateURL(input);
        break;
      case 'username':
        validationResult = InputValidator.validateUsername(input);
        break;
      case 'apiKey':
        validationResult = InputValidator.validateAPIKey(input, options?.provider);
        break;
      case 'address':
        if (options?.addressType === 'flow') {
          validationResult = InputValidator.validateFlowAddress(input);
        } else if (options?.addressType === 'ethereum') {
          validationResult = InputValidator.validateEthereumAddress(input);
        } else {
          validationResult = { isValid: true, errors: [], sanitizedValue: input.trim() };
        }
        break;
      case 'breathingPatternName':
        validationResult = InputValidator.validateBreathingPatternName(input);
        break;
      case 'number':
        validationResult = InputValidator.validateNumber(input, options?.min, options?.max, options?.allowDecimals);
        break;
      case 'text':
      default:
        validationResult = InputValidator.validateTextInput(input, options?.maxLength || 1000);
    }
    
    // Sanitize the validated input
    let sanitizedValue = '';
    if (validationResult.sanitizedValue) {
      switch (type) {
        case 'email':
          sanitizedValue = DataSanitizer.sanitizeEmail(validationResult.sanitizedValue);
          break;
        case 'url':
          sanitizedValue = DataSanitizer.sanitizeURL(validationResult.sanitizedValue);
          break;
        case 'username':
          sanitizedValue = DataSanitizer.sanitizeUsername(validationResult.sanitizedValue);
          break;
        case 'apiKey':
          sanitizedValue = DataSanitizer.sanitizeAPIKey(validationResult.sanitizedValue);
          break;
        case 'address':
          sanitizedValue = DataSanitizer.sanitizeAddress(validationResult.sanitizedValue);
          break;
        case 'breathingPatternName':
          sanitizedValue = DataSanitizer.sanitizeBreathingPatternName(validationResult.sanitizedValue);
          break;
        case 'number':
          const numValue = DataSanitizer.sanitizeNumber(validationResult.sanitizedValue, options?.allowDecimals);
          sanitizedValue = numValue !== null ? numValue.toString() : '';
          break;
        case 'text':
        default:
          sanitizedValue = DataSanitizer.sanitizeText(validationResult.sanitizedValue, options);
      }
    }
    
    return {
      isValid: validationResult.isValid,
      sanitizedValue,
      errors: validationResult.errors
    };
  }
  
  /**
   * Generate CSRF token
   * @returns CSRF token
   */
  generateCSRFToken(): string {
    // Generate a random CSRF token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Validate CSRF token
   * @param token Token to validate
   * @param expected Expected token
   * @returns True if token is valid
   */
  validateCSRFToken(token: string, expected: string): boolean {
    if (!token || !expected) {
      return false;
    }
    
    // Use timing-safe comparison to prevent timing attacks
    if (token.length !== expected.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    
    return result === 0;
  }
  
  /**
   * Check rate limit for an IP or identifier
   * @param identifier IP address or user identifier
   * @returns True if request is allowed, false if rate limited
   */
  checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const limit = rateLimitStore.get(identifier);
    
    if (!limit || now > limit.resetTime) {
      // Reset the counter
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + SECURITY_CONFIG.rateLimit.windowMs
      });
      return true;
    }
    
    if (limit.count >= SECURITY_CONFIG.rateLimit.maxRequests) {
      // Rate limited
      return false;
    }
    
    // Increment the counter
    limit.count++;
    rateLimitStore.set(identifier, limit);
    return true;
  }
  
  /**
   * Generate secure session ID
   * @returns Secure session ID
   */
  generateSessionId(): string {
    // Generate a cryptographically secure session ID
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Hash password securely
   * @param password Password to hash
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    // Use subtle crypto for password hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * Generate secure random string
   * @param length Length of the string
   * @returns Secure random string
   */
  generateSecureRandomString(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Validate JWT token
   * @param token JWT token to validate
   * @returns True if token is valid
   */
  validateJWT(token: string): boolean {
    if (!token) {
      return false;
    }
    
    // Basic JWT format validation
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }
    
    // Validate each part is base64url encoded
    try {
      for (const part of parts) {
        // Decode base64url
        const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
        atob(base64);
      }
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Sanitize object properties
   * @param obj Object to sanitize
   * @param sanitizers Sanitizers for each property
   * @returns Sanitized object
   */
  sanitizeObject(
    obj: Record<string, any>,
    sanitizers: Record<string, string | ((value: unknown) => any)>
  ): Record<string, any> {
    return DataSanitizer.sanitizeObject(obj, sanitizers);
  }
  
  /**
   * Get security headers
   * @returns Security headers
   */
  getSecurityHeaders(): Record<string, string> {
    return SECURITY_CONFIG.headers;
  }
  
  /**
   * Get Content Security Policy
   * @returns CSP string
   */
  getContentSecurityPolicy(): string {
    return SECURITY_CONFIG.headers['Content-Security-Policy'];
  }
  
  /**
   * Validate API request
   * @param request Request object
   * @returns Validation result
   */
  validateAPIRequest(request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for dangerous methods
    const dangerousMethods = ['TRACE', 'TRACK', 'CONNECT'];
    if (dangerousMethods.includes(request.method.toUpperCase())) {
      errors.push(`Dangerous HTTP method: ${request.method}`);
    }
    
    // Check for dangerous headers
    const dangerousHeaders = [
      'x-forwarded-for',
      'x-forwarded-host',
      'x-forwarded-proto',
      'x-real-ip',
      'client-ip'
    ];
    
    for (const [headerName, headerValue] of Object.entries(request.headers)) {
      const lowerHeaderName = headerName.toLowerCase();
      
      // Check for dangerous headers
      if (dangerousHeaders.includes(lowerHeaderName)) {
        errors.push(`Dangerous header: ${headerName}`);
      }
      
      // Check for header injection
      if (typeof headerValue === 'string' && /[\r\n]/.test(headerValue)) {
        errors.push(`Header injection attempt in ${headerName}`);
      }
    }
    
    // Validate URL
    const urlValidation = InputValidator.validateURL(request.url);
    if (!urlValidation.isValid) {
      errors.push(...urlValidation.errors.map(e => `URL validation: ${e}`));
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Sanitize API response
   * @param data Data to sanitize
   * @returns Sanitized data
   */
  sanitizeAPIResponse(data: any): any {
    // Prevent circular references
    const seen = new WeakSet();
    
    const sanitize = (obj: any): any => {
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      // Prevent circular references
      if (seen.has(obj)) {
        return '[Circular]';
      }
      
      seen.add(obj);
      
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key
        const sanitizedKey = DataSanitizer.sanitizeText(key, { maxLength: 100 });
        
        // Sanitize value
        if (typeof value === 'string') {
          sanitized[sanitizedKey] = DataSanitizer.sanitizeText(value, { maxLength: 10000 });
        } else if (value === null || value === undefined) {
          sanitized[sanitizedKey] = value;
        } else if (typeof value === 'object') {
          sanitized[sanitizedKey] = sanitize(value);
        } else {
          sanitized[sanitizedKey] = value;
        }
      }
      
      seen.delete(obj);
      return sanitized;
    };
    
    return sanitize(data);
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Convenience functions
export const validateAndSanitizeInput = (
  input: string,
  type: 'email' | 'url' | 'text' | 'username' | 'apiKey' | 'address' | 'number' | 'breathingPatternName',
  options?: any
) => securityManager.validateAndSanitizeInput(input, type, options);

export const generateCSRFToken = () => securityManager.generateCSRFToken();
export const validateCSRFToken = (token: string, expected: string) => securityManager.validateCSRFToken(token, expected);
export const checkRateLimit = (identifier: string) => securityManager.checkRateLimit(identifier);
export const generateSessionId = () => securityManager.generateSessionId();
export const hashPassword = (password: string) => securityManager.hashPassword(password);
export const generateSecureRandomString = (length: number = 32) => securityManager.generateSecureRandomString(length);
export const validateJWT = (token: string) => securityManager.validateJWT(token);
export const sanitizeObject = (
  obj: Record<string, any>,
  sanitizers: Record<string, string | ((value: unknown) => any)>
) => securityManager.sanitizeObject(obj, sanitizers);

export const getSecurityHeaders = () => securityManager.getSecurityHeaders();
export const getContentSecurityPolicy = () => securityManager.getContentSecurityPolicy();

export const validateAPIRequest = (request: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}) => securityManager.validateAPIRequest(request);

export const sanitizeAPIResponse = (data: any) => securityManager.sanitizeAPIResponse(data);