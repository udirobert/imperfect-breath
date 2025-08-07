import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names together, handling conditionals and Tailwind class conflicts
 * 
 * This utility function combines the power of clsx (for conditional class handling)
 * with tailwind-merge (for resolving conflicts between Tailwind CSS classes)
 * 
 * @example
 * // Basic usage
 * cn("text-red-500", "bg-blue-500")
 * 
 * @example
 * // With conditionals
 * cn("text-lg", isActive && "font-bold", {"hidden": !isVisible})
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Simple localStorage wrapper for session preferences
 * Minimal implementation to avoid code bloat
 */
export const storage = {
  set: (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`breath_${key}`, JSON.stringify(value));
    }
  },
  get: <T = any>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(`breath_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
};
