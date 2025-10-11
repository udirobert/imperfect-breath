/**
 * Data Sanitization Utilities
 * Provides comprehensive sanitization to prevent XSS attacks and ensure data safety
 */

// HTML entities for encoding
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

// Dangerous HTML tags to remove
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select',
  'button', 'link', 'meta', 'style', 'title', 'base', 'applet', 'bgsound',
  'blink', 'body', 'frame', 'frameset', 'head', 'html', 'ilayer', 'layer',
  'marquee', 'noscript', 'plaintext', 'xml'
];

// Dangerous attributes to remove
const DANGEROUS_ATTRIBUTES = [
  'onabort', 'onactivate', 'onafterprint', 'onafterupdate', 'onbeforeactivate',
  'onbeforecopy', 'onbeforecut', 'onbeforedeactivate', 'onbeforeeditfocus',
  'onbeforepaste', 'onbeforeprint', 'onbeforeunload', 'onbeforeupdate', 'onblur',
  'onbounce', 'oncellchange', 'onchange', 'onclick', 'oncontextmenu', 'oncontrolselect',
  'oncopy', 'oncut', 'ondataavailable', 'ondatasetchanged', 'ondatasetcomplete',
  'ondblclick', 'ondeactivate', 'ondrag', 'ondragend', 'ondragenter', 'ondragleave',
  'ondragover', 'ondragstart', 'ondrop', 'onerror', 'onerrorupdate', 'onfilterchange',
  'onfinish', 'onfocus', 'onfocusin', 'onfocusout', 'onhelp', 'onkeydown', 'onkeypress',
  'onkeyup', 'onlayoutcomplete', 'onload', 'onlosecapture', 'onmousedown', 'onmouseenter',
  'onmouseleave', 'onmousemove', 'onmouseout', 'onmouseover', 'onmouseup', 'onmousewheel',
  'onmove', 'onmoveend', 'onmovestart', 'onpaste', 'onpropertychange', 'onreadystatechange',
  'onreset', 'onresize', 'onresizeend', 'onresizestart', 'onrowenter', 'onrowexit',
  'onrowsdelete', 'onrowsinserted', 'onscroll', 'onselect', 'onselectionchange',
  'onselectstart', 'onstart', 'onstop', 'onsubmit', 'onunload'
];

/**
 * Main sanitizer class
 */
export class DataSanitizer {
  /**
   * Encode HTML entities to prevent XSS
   */
  static encodeHTML(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }

    return text.replace(/[&<>"'`=/]/g, (match) => HTML_ENTITIES[match] || match);
  }

  /**
   * Decode HTML entities
   */
  static decodeHTML(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }

    const entityMap = Object.fromEntries(
      Object.entries(HTML_ENTITIES).map(([char, entity]) => [entity, char])
    );

    return text.replace(/&[#\w]+;/g, (entity) => entityMap[entity] || entity);
  }

  /**
   * Remove dangerous HTML tags
   */
  static removeDangerousTags(html: string): string {
    if (typeof html !== 'string') {
      return String(html);
    }

    let sanitized = html;

    // Remove dangerous tags and their content
    for (const tag of DANGEROUS_TAGS) {
      const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!</${tag}>)<[^<]*)*</${tag}>`, 'gi');
      sanitized = sanitized.replace(regex, '');
      
      // Also remove self-closing tags
      const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\/?>`, 'gi');
      sanitized = sanitized.replace(selfClosingRegex, '');
    }

    return sanitized;
  }

  /**
   * Remove dangerous attributes from HTML
   */
  static removeDangerousAttributes(html: string): string {
    if (typeof html !== 'string') {
      return String(html);
    }

    let sanitized = html;

    // Remove dangerous attributes
    for (const attr of DANGEROUS_ATTRIBUTES) {
      const regex = new RegExp(`\\s${attr}\\s*=\\s*[^\\s>]*`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    sanitized = sanitized.replace(/data:/gi, '');

    return sanitized;
  }

  /**
   * Sanitize user input text (comprehensive)
   */
  static sanitizeText(text: string, options: {
    allowHTML?: boolean;
    maxLength?: number;
    removeNewlines?: boolean;
  } = {}): string {
    if (typeof text !== 'string') {
      return String(text);
    }

    let sanitized = text;

    // Trim whitespace
    sanitized = sanitized.trim();

    // Limit length
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // Remove newlines if requested
    if (options.removeNewlines) {
      sanitized = sanitized.replace(/[\r\n]/g, ' ');
    }

    // Handle HTML
    if (options.allowHTML) {
      // Remove dangerous tags and attributes but keep safe HTML
      sanitized = this.removeDangerousTags(sanitized);
      sanitized = this.removeDangerousAttributes(sanitized);
    } else {
      // Encode all HTML entities
      sanitized = this.encodeHTML(sanitized);
    }

    return sanitized;
  }

  /**
   * Sanitize API key (remove whitespace, validate format)
   */
  static sanitizeAPIKey(apiKey: string): string {
    if (typeof apiKey !== 'string') {
      return '';
    }

    // Remove all whitespace and control characters
    return apiKey.replace(/[\s\u0000-\u001F\u007F]/g, '');
  }

  /**
   * Sanitize blockchain address
   */
  static sanitizeAddress(address: string): string {
    if (typeof address !== 'string') {
      return '';
    }

    // Remove whitespace and convert to lowercase
    return address.trim().toLowerCase();
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(username: string): string {
    if (typeof username !== 'string') {
      return '';
    }

    // Remove dangerous characters, keep only alphanumeric, hyphens, underscores
    return username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .substring(0, 20);
  }

  /**
   * Sanitize email address
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return '';
    }

    // Trim and convert to lowercase
    return email.trim().toLowerCase();
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url: string): string {
    if (typeof url !== 'string') {
      return '';
    }

    const trimmed = url.trim();

    // Only allow http and https protocols
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return '';
    }

    return trimmed;
  }

  /**
   * Sanitize breathing pattern name
   */
  static sanitizeBreathingPatternName(name: string): string {
    if (typeof name !== 'string') {
      return '';
    }

    // Allow alphanumeric, spaces, hyphens, underscores, parentheses
    return name
      .trim()
      .replace(/[^a-zA-Z0-9\s\-_()]/g, '')
      .substring(0, 50);
  }

  /**
   * Sanitize numeric input
   */
  static sanitizeNumber(value: string | number, allowDecimals: boolean = true): number | null {
    if (typeof value === 'number') {
      return isNaN(value) ? null : value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    // Remove non-numeric characters (except decimal point and minus sign)
    const cleaned = value.replace(/[^0-9.-]/g, '');
    
    if (!cleaned) {
      return null;
    }

    const parsed = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Sanitize breathing session data
   */
  static sanitizeBreathingSession(sessionData: unknown): {
    patternName?: string;
    duration?: number;
    breathHoldTime?: number;
    restlessnessScore?: number;
    bpm?: number;
    consistencyScore?: number;
  } {
    // Type guard to ensure sessionData is an object
    if (!sessionData || typeof sessionData !== 'object') {
      return {};
    }

    const sanitized: {
      patternName?: string;
      duration?: number;
      breathHoldTime?: number;
      restlessnessScore?: number;
      bpm?: number;
      consistencyScore?: number;
    } = {};

    if ('patternName' in sessionData && sessionData.patternName !== undefined && sessionData.patternName !== null) {
      sanitized.patternName = this.sanitizeBreathingPatternName(sessionData.patternName as string);
    }

    if ('duration' in sessionData && sessionData.duration !== undefined && sessionData.duration !== null) {
      const sanitizedValue = this.sanitizeNumber(sessionData.duration as number);
      if (sanitizedValue !== null) {
        sanitized.duration = sanitizedValue;
      }
    }

    if ('breathHoldTime' in sessionData && sessionData.breathHoldTime !== undefined && sessionData.breathHoldTime !== null) {
      const sanitizedValue = this.sanitizeNumber(sessionData.breathHoldTime as number);
      if (sanitizedValue !== null) {
        sanitized.breathHoldTime = sanitizedValue;
      }
    }

    if ('restlessnessScore' in sessionData && sessionData.restlessnessScore !== undefined && sessionData.restlessnessScore !== null) {
      const sanitizedValue = this.sanitizeNumber(sessionData.restlessnessScore as number, false);
      if (sanitizedValue !== null) {
        sanitized.restlessnessScore = sanitizedValue;
      }
    }

    if ('bpm' in sessionData && sessionData.bpm !== undefined && sessionData.bpm !== null) {
      const sanitizedValue = this.sanitizeNumber(sessionData.bpm as number);
      if (sanitizedValue !== null) {
        sanitized.bpm = sanitizedValue;
      }
    }

    if ('consistencyScore' in sessionData && sessionData.consistencyScore !== undefined && sessionData.consistencyScore !== null) {
      const sanitizedValue = this.sanitizeNumber(sessionData.consistencyScore as number, false);
      if (sanitizedValue !== null) {
        sanitized.consistencyScore = sanitizedValue;
      }
    }

    return sanitized;
  }

  /**
   * Batch sanitize object properties
   */
  static sanitizeObject(
    obj: Record<string, any>,
    sanitizers: Record<string, string | ((value: unknown) => any)>
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizer = sanitizers[key];
      
      if (!sanitizer) {
        // No sanitizer specified, use basic text sanitization
        sanitized[key] = this.sanitizeText(String(value));
        continue;
      }

      if (typeof sanitizer === 'function') {
        sanitized[key] = sanitizer(value);
      } else {
        switch (sanitizer) {
          case 'text':
            sanitized[key] = this.sanitizeText(value);
            break;
          case 'html':
            sanitized[key] = this.sanitizeText(value, { allowHTML: true });
            break;
          case 'apiKey':
            sanitized[key] = this.sanitizeAPIKey(value);
            break;
          case 'address':
            sanitized[key] = this.sanitizeAddress(value);
            break;
          case 'username':
            sanitized[key] = this.sanitizeUsername(value);
            break;
          case 'email':
            sanitized[key] = this.sanitizeEmail(value);
            break;
          case 'url':
            sanitized[key] = this.sanitizeURL(value);
            break;
          case 'number':
            sanitized[key] = this.sanitizeNumber(value);
            break;
          case 'integer':
            sanitized[key] = this.sanitizeNumber(value, false);
            break;
          default:
            sanitized[key] = this.sanitizeText(String(value));
        }
      }
    }

    return sanitized;
  }
}

export default DataSanitizer;
