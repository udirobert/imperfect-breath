/**
 * Input Validation Utilities
 * Provides comprehensive validation for user inputs to prevent XSS and ensure data integrity
 */

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: string;
}

// Common validation patterns
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  flowAddress: /^0x[a-fA-F0-9]{16}$/,
  ethereumAddress: /^0x[a-fA-F0-9]{40}$/,
  apiKey: /^[a-zA-Z0-9\-_\.]+$/,
  username: /^[a-zA-Z0-9_-]{3,20}$/,
  breathingPatternName: /^[a-zA-Z0-9\s\-_()]{1,50}$/
};

// Dangerous HTML patterns to detect
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi
];

/**
 * Base validator class
 */
export class InputValidator {
  /**
   * Validate email address
   */
  static validateEmail(email: string): ValidationResult {
    const trimmed = email.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('Email is required');
    } else if (trimmed.length > 254) {
      errors.push('Email is too long');
    } else if (!VALIDATION_PATTERNS.email.test(trimmed)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed.toLowerCase()
    };
  }

  /**
   * Validate URL
   */
  static validateURL(url: string): ValidationResult {
    const trimmed = url.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('URL is required');
    } else if (trimmed.length > 2048) {
      errors.push('URL is too long');
    } else if (!VALIDATION_PATTERNS.url.test(trimmed)) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed
    };
  }

  /**
   * Validate Flow blockchain address
   */
  static validateFlowAddress(address: string): ValidationResult {
    const trimmed = address.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('Flow address is required');
    } else if (!VALIDATION_PATTERNS.flowAddress.test(trimmed)) {
      errors.push('Invalid Flow address format (should be 0x followed by 16 hex characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed.toLowerCase()
    };
  }

  /**
   * Validate Ethereum address
   */
  static validateEthereumAddress(address: string): ValidationResult {
    const trimmed = address.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('Ethereum address is required');
    } else if (!VALIDATION_PATTERNS.ethereumAddress.test(trimmed)) {
      errors.push('Invalid Ethereum address format (should be 0x followed by 40 hex characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed.toLowerCase()
    };
  }

  /**
   * Validate API key
   */
  static validateAPIKey(apiKey: string, provider?: string): ValidationResult {
    const trimmed = apiKey.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('API key is required');
    } else if (trimmed.length < 10) {
      errors.push('API key is too short');
    } else if (trimmed.length > 200) {
      errors.push('API key is too long');
    } else if (!VALIDATION_PATTERNS.apiKey.test(trimmed)) {
      errors.push('API key contains invalid characters');
    }

    // Provider-specific validation
    if (provider && trimmed) {
      switch (provider.toLowerCase()) {
        case 'google':
        case 'gemini':
          if (!trimmed.startsWith('AIza')) {
            errors.push('Google API key should start with "AIza"');
          }
          break;
        case 'openai':
          if (!trimmed.startsWith('sk-')) {
            errors.push('OpenAI API key should start with "sk-"');
          }
          break;
        case 'anthropic':
          if (!trimmed.startsWith('sk-ant-')) {
            errors.push('Anthropic API key should start with "sk-ant-"');
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed
    };
  }

  /**
   * Validate username
   */
  static validateUsername(username: string): ValidationResult {
    const trimmed = username.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('Username is required');
    } else if (trimmed.length < 3) {
      errors.push('Username must be at least 3 characters');
    } else if (trimmed.length > 20) {
      errors.push('Username must be less than 20 characters');
    } else if (!VALIDATION_PATTERNS.username.test(trimmed)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed.toLowerCase()
    };
  }

  /**
   * Validate breathing pattern name
   */
  static validateBreathingPatternName(name: string): ValidationResult {
    const trimmed = name.trim();
    const errors: string[] = [];

    if (!trimmed) {
      errors.push('Pattern name is required');
    } else if (trimmed.length < 1) {
      errors.push('Pattern name cannot be empty');
    } else if (trimmed.length > 50) {
      errors.push('Pattern name must be less than 50 characters');
    } else if (!VALIDATION_PATTERNS.breathingPatternName.test(trimmed)) {
      errors.push('Pattern name contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: trimmed
    };
  }

  /**
   * Validate text input for XSS
   */
  static validateTextInput(text: string, maxLength: number = 1000): ValidationResult {
    const errors: string[] = [];

    if (text.length > maxLength) {
      errors.push(`Text must be less than ${maxLength} characters`);
    }

    // Check for XSS patterns
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(text)) {
        errors.push('Text contains potentially dangerous content');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: text.trim()
    };
  }

  /**
   * Validate numeric input
   */
  static validateNumber(
    value: string | number,
    min?: number,
    max?: number,
    allowDecimals: boolean = true
  ): ValidationResult {
    const errors: string[] = [];
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      errors.push('Must be a valid number');
    } else {
      if (!allowDecimals && numValue % 1 !== 0) {
        errors.push('Must be a whole number');
      }
      if (min !== undefined && numValue < min) {
        errors.push(`Must be at least ${min}`);
      }
      if (max !== undefined && numValue > max) {
        errors.push(`Must be at most ${max}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue: numValue.toString()
    };
  }

  /**
   * Validate breathing session data
   */
  static validateBreathingSession(sessionData: {
    patternName?: string;
    duration?: number;
    breathHoldTime?: number;
    restlessnessScore?: number;
  }): ValidationResult {
    const errors: string[] = [];

    if (sessionData.patternName) {
      const nameValidation = this.validateBreathingPatternName(sessionData.patternName);
      if (!nameValidation.isValid) {
        errors.push(...nameValidation.errors.map(e => `Pattern name: ${e}`));
      }
    }

    if (sessionData.duration !== undefined) {
      const durationValidation = this.validateNumber(sessionData.duration, 1, 7200); // 1 second to 2 hours
      if (!durationValidation.isValid) {
        errors.push(...durationValidation.errors.map(e => `Duration: ${e}`));
      }
    }

    if (sessionData.breathHoldTime !== undefined) {
      const holdValidation = this.validateNumber(sessionData.breathHoldTime, 0, 300); // 0 to 5 minutes
      if (!holdValidation.isValid) {
        errors.push(...holdValidation.errors.map(e => `Breath hold time: ${e}`));
      }
    }

    if (sessionData.restlessnessScore !== undefined) {
      const restlessValidation = this.validateNumber(sessionData.restlessnessScore, 0, 100, false);
      if (!restlessValidation.isValid) {
        errors.push(...restlessValidation.errors.map(e => `Restlessness score: ${e}`));
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Batch validate multiple fields
   */
  static validateFields(fields: Record<string, { value: any; validator: string; options?: any }>): {
    isValid: boolean;
    errors: Record<string, string[]>;
    sanitizedValues: Record<string, any>;
  } {
    const errors: Record<string, string[]> = {};
    const sanitizedValues: Record<string, any> = {};
    let isValid = true;

    for (const [fieldName, { value, validator, options }] of Object.entries(fields)) {
      let result: ValidationResult;

      switch (validator) {
        case 'email':
          result = this.validateEmail(value);
          break;
        case 'url':
          result = this.validateURL(value);
          break;
        case 'flowAddress':
          result = this.validateFlowAddress(value);
          break;
        case 'ethereumAddress':
          result = this.validateEthereumAddress(value);
          break;
        case 'apiKey':
          result = this.validateAPIKey(value, options?.provider);
          break;
        case 'username':
          result = this.validateUsername(value);
          break;
        case 'breathingPatternName':
          result = this.validateBreathingPatternName(value);
          break;
        case 'textInput':
          result = this.validateTextInput(value, options?.maxLength);
          break;
        case 'number':
          result = this.validateNumber(value, options?.min, options?.max, options?.allowDecimals);
          break;
        default:
          result = { isValid: true, errors: [], sanitizedValue: value };
      }

      if (!result.isValid) {
        errors[fieldName] = result.errors;
        isValid = false;
      }

      if (result.sanitizedValue !== undefined) {
        sanitizedValues[fieldName] = result.sanitizedValue;
      }
    }

    return { isValid, errors, sanitizedValues };
  }
}

export default InputValidator;
