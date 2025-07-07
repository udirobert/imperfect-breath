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
