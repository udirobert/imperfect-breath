import { useState, useCallback } from 'react';
import { InputValidator, ValidationResult } from '@/lib/validation/input-validator';
import { DataSanitizer } from '@/lib/validation/sanitizer';

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
    value: any,
    validator: string,
    options?: any
  ): ValidationResult => {
    let result: ValidationResult;

    switch (validator) {
      case 'email':
        result = InputValidator.validateEmail(value);
        break;
      case 'url':
        result = InputValidator.validateURL(value);
        break;
      case 'flowAddress':
        result = InputValidator.validateFlowAddress(value);
        break;
      case 'ethereumAddress':
        result = InputValidator.validateEthereumAddress(value);
        break;
      case 'apiKey':
        result = InputValidator.validateAPIKey(value, options?.provider);
        break;
      case 'username':
        result = InputValidator.validateUsername(value);
        break;
      case 'breathingPatternName':
        result = InputValidator.validateBreathingPatternName(value);
        break;
      case 'textInput':
        result = InputValidator.validateTextInput(value, options?.maxLength);
        break;
      case 'number':
        result = InputValidator.validateNumber(value, options?.min, options?.max, options?.allowDecimals);
        break;
      default:
        result = { isValid: true, errors: [], sanitizedValue: value };
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
    fields: Record<string, { value: any; validator: string; options?: any }>
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

  const sanitizeValue = useCallback((value: any, sanitizer: string): any => {
    switch (sanitizer) {
      case 'text':
        return DataSanitizer.sanitizeText(value);
      case 'html':
        return DataSanitizer.sanitizeText(value, { allowHTML: true });
      case 'apiKey':
        return DataSanitizer.sanitizeAPIKey(value);
      case 'address':
        return DataSanitizer.sanitizeAddress(value);
      case 'username':
        return DataSanitizer.sanitizeUsername(value);
      case 'email':
        return DataSanitizer.sanitizeEmail(value);
      case 'url':
        return DataSanitizer.sanitizeURL(value);
      case 'number':
        return DataSanitizer.sanitizeNumber(value);
      case 'integer':
        return DataSanitizer.sanitizeNumber(value, false);
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
