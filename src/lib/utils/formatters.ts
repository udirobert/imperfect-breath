/**
 * Consolidated Formatting Utilities
 * 
 * This module consolidates all formatting functions that were duplicated
 * across multiple components to eliminate code duplication and ensure
 * consistent formatting throughout the application.
 */

/**
 * Format duration in seconds to human-readable string
 * @param seconds Duration in seconds
 * @param format Format type: 'short' (5m), 'long' (5m 30s), 'colon' (5:30)
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number, format: 'short' | 'long' | 'colon' = 'short'): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  switch (format) {
    case 'short':
      return `${minutes} min`;
    case 'long':
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${remainingSeconds}s`;
    case 'colon':
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    default:
      return `${minutes} min`;
  }
}

/**
 * Format time in seconds to MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format large numbers with K/M suffixes
 * @param count Number to format
 * @returns Formatted count string (e.g., 1.2K, 2.5M)
 */
export function formatCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Format a date string to relative time (e.g., "2h ago", "3d ago")
 * @param dateString ISO date string or Date object
 * @returns Formatted relative time string
 */
export function formatTimeAgo(dateString: string | Date): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format file size in bytes to human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size (e.g., 1.2 KB, 3.4 MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format percentage with optional decimal places
 * @param value Decimal value (0.75 = 75%)
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency amount
 * @param amount Amount in base currency units
 * @param currency Currency code (default: 'USD')
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number, 
  currency: string = 'USD', 
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Format a number with thousand separators
 * @param num Number to format
 * @param locale Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format decimal number to fixed decimal places
 * @param num Number to format
 * @param decimals Number of decimal places
 * @returns Formatted decimal string
 */
export function formatDecimal(num: number, decimals: number = 2): string {
  return num.toFixed(decimals);
}

/**
 * Format breathing session quality score
 * @param sessionData Session data object
 * @returns Quality score (0-100)
 */
export function formatQualityScore(sessionData: {
  restlessnessScore?: number;
  score?: number;
}): number {
  if (sessionData.restlessnessScore !== undefined) {
    return Math.max(0, 100 - sessionData.restlessnessScore);
  }
  return sessionData.score || 75;
}

/**
 * Calculate breathing session quality score
 * @param sessionData Session data object
 * @returns Quality score (0-100)
 */
export function calculateQualityScore(sessionData: any): number {
  if (sessionData.restlessnessScore !== undefined) {
    return Math.max(0, 100 - sessionData.restlessnessScore);
  }
  return sessionData.score || 75;
}

/**
 * Validate session data for formatting
 * @param sessionData Session data object
 * @returns True if valid for formatting
 */
export function validateSessionData(sessionData: {
  patternName?: string;
  duration?: number;
}): boolean {
  return !!(sessionData.patternName && sessionData.duration && sessionData.duration > 0);
}

// Export all formatters as a namespace for organized imports
export const Formatters = {
  duration: formatDuration,
  time: formatTime,
  count: formatCount,
  timeAgo: formatTimeAgo,
  fileSize: formatFileSize,
  percentage: formatPercentage,
  currency: formatCurrency,
  number: formatNumber,
  decimal: formatDecimal,
  qualityScore: formatQualityScore,
  validateSessionData,
};

export default Formatters;