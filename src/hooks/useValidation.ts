import { useState, useCallback } from 'react';
import { InputValidator, ValidationResult } from '../lib/validation/input-validator';
import { DataSanitizer } from '../lib/validation/sanitizer';

interface ValidationState {
  errors: Record<string, string[]>;
  isValid: boolean;
  isValidating: boolean;
}

/**
 * Hook for form validation and sanitization
 */
export const useValidation = () => {
  const [validationState, setValidationState] = useState<ValidationState>({
    errors: {},
    isValid: true,
    isValidating: false
  });

  const validateField = useCallback((
    fieldName: string,
    value: unknown,
    validator: string,
    options?: { provider?: string; maxLength?: number; min?: number; max?: number; allowDecimals?: boolean }
  ): ValidationResult => {
    let result: ValidationResult;
    const stringValue = String(value);
    const numericValue = typeof value === 'number' ? value : Number(value);

    switch (validator) {
      case 'email':
        result = InputValidator.validateEmail(stringValue);
        break;
      case 'url':
        result = InputValidator.validateURL(stringValue);
        break;
      case 'flowAddress':
        result = InputValidator.validateFlowAddress(stringValue);
        break;
      case 'ethereumAddress':
        result = InputValidator.validateEthereumAddress(stringValue);
        break;
      case 'apiKey':
        result = InputValidator.validateAPIKey(stringValue, options?.provider);
        break;
      case 'username':
        result = InputValidator.validateUsername(stringValue);
        break;
      case 'breathingPatternName':
        result = InputValidator.validateBreathingPatternName(stringValue);
        break;
      case 'textInput':
        result = InputValidator.validateTextInput(stringValue, options?.maxLength);
        break;
      case 'number':
        result = InputValidator.validateNumber(numericValue, options?.min, options?.max, options?.allowDecimals);
        break;
      default:
        result = { isValid: true, errors: [], sanitizedValue: stringValue };
    }

    // Update validation state
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: result.errors
      },
      isValid: result.isValid && Object.values({ ...prev.errors, [fieldName]: result.errors })
        .every(errors => errors.length === 0)
    }));

    return result;
  }, []);

  const validateFields = useCallback((
    fields: Record<string, { value: unknown; validator: string; options?: unknown }>
  ) => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    const result = InputValidator.validateFields(fields);

    setValidationState({
      errors: result.errors,
      isValid: result.isValid,
      isValidating: false
    });

    return result;
  }, []);

  const sanitizeValue = useCallback((value: unknown, sanitizer: string): string | number => {
    switch (sanitizer) {
      case 'text':
        return DataSanitizer.sanitizeText(String(value));
      case 'html':
        return DataSanitizer.sanitizeText(String(value), { allowHTML: true });
      case 'apiKey':
        return DataSanitizer.sanitizeAPIKey(String(value));
      case 'address':
        return DataSanitizer.sanitizeAddress(String(value));
      case 'username':
        return DataSanitizer.sanitizeUsername(String(value));
      case 'email':
        return DataSanitizer.sanitizeEmail(String(value));
      case 'url':
        return DataSanitizer.sanitizeURL(String(value));
      case 'number':
        const numResult = DataSanitizer.sanitizeNumber(value);
        return numResult !== null ? numResult : String(value);
      case 'integer':
        const intResult = DataSanitizer.sanitizeNumber(value, false);
        return intResult !== null ? intResult : String(value);
      default:
        return DataSanitizer.sanitizeText(String(value));
    }
  }, []);

  const clearErrors = useCallback((fieldName?: string) => {
    if (fieldName) {
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: []
        }
      }));
    } else {
      setValidationState(prev => ({
        ...prev,
        errors: {},
        isValid: true
      }));
    }
  }, []);

  const getFieldError = useCallback((fieldName: string): string | null => {
    const errors = validationState.errors[fieldName];
    return errors && errors.length > 0 ? errors[0] : null;
  }, [validationState.errors]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    const errors = validationState.errors[fieldName];
    return errors && errors.length > 0;
  }, [validationState.errors]);

  return {
    validationState,
    validateField,
    validateFields,
    sanitizeValue,
    clearErrors,
    getFieldError,
    hasFieldError
  };
};

/**
 * Hook for API key validation specifically
 */
export const useAPIKeyValidation = () => {
  const { validateField, sanitizeValue, getFieldError, hasFieldError } = useValidation();

  const validateAPIKey = useCallback((apiKey: string, provider: string) => {
    // First sanitize the API key
    const sanitized = sanitizeValue(apiKey, 'apiKey');
    
    // Then validate it
    const result = validateField('apiKey', sanitized, 'apiKey', { provider });
    
    return {
      ...result,
      sanitizedValue: sanitized
    };
  }, [validateField, sanitizeValue]);

  return {
    validateAPIKey,
    getAPIKeyError: () => getFieldError('apiKey'),
    hasAPIKeyError: () => hasFieldError('apiKey')
  };
};

/**
 * Hook for breathing session validation
 */
export const useBreathingSessionValidation = () => {
  const { validateFields, sanitizeValue } = useValidation();

  const validateSession = useCallback((sessionData: {
    patternName?: string;
    duration?: number;
    breathHoldTime?: number;
    restlessnessScore?: number;
  }) => {
    // First sanitize the session data
    const sanitized = DataSanitizer.sanitizeBreathingSession(sessionData);
    
    // Then validate it
    const result = InputValidator.validateBreathingSession(sanitized);
    
    return {
      ...result,
      sanitizedData: sanitized
    };
  }, [validateFields, sanitizeValue]);

  return {
    validateSession
  };
};

export default useValidation;
