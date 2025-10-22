/**
 * User-Friendly Error Messages
 * 
 * CLEAN: Single source of truth for error message translation
 * DRY: Reusable across all blockchain operations
 * ENHANCEMENT FIRST: Enhances existing error handling
 */

export const getUserFriendlyError = (error: Error | string): string => {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();
  
  // Blockchain-specific errors
  const errorMap: Record<string, string> = {
    // Wallet & Connection
    'insufficient funds': 'Not enough tokens in your wallet. Please add funds and try again.',
    'user rejected': 'Transaction cancelled. No changes were made.',
    'user denied': 'Transaction cancelled. No changes were made.',
    'network error': 'Network connection issue. Please check your connection and try again.',
    'session expired': 'Your session expired. Please reconnect your wallet.',
    'not authenticated': 'Please connect your wallet first.',
    'no wallet': 'No wallet detected. Please install a Web3 wallet.',
    
    // Lens Protocol
    'not allowed': 'You don\'t have permission to perform this action.',
    'invalid metadata': 'Content format is invalid. Please try again.',
    'rate limit': 'Too many requests. Please wait a moment and try again.',
    'account not found': 'Lens account not found. Please create an account first.',
    
    // Flow Blockchain
    'transaction failed': 'Transaction failed. Please try again.',
    'gas limit': 'Transaction requires more gas. Please try again.',
    'nft not found': 'NFT not found. It may have been transferred or deleted.',
    'collection not found': 'NFT collection not initialized. Please set up your account first.',
    
    // General
    'timeout': 'Request timed out. Please try again.',
    'unknown error': 'Something unexpected happened. Please try again.',
  };
  
  // Find matching error
  for (const [key, friendlyMsg] of Object.entries(errorMap)) {
    if (lowerMessage.includes(key)) {
      return friendlyMsg;
    }
  }
  
  // Default fallback
  return 'Something went wrong. Please try again or contact support if the issue persists.';
};

/**
 * Get action-specific error message with context
 */
export const getActionError = (action: string, error: Error | string): string => {
  const baseMessage = getUserFriendlyError(error);
  const actionContext: Record<string, string> = {
    'post': 'Failed to create post',
    'comment': 'Failed to add comment',
    'follow': 'Failed to follow user',
    'unfollow': 'Failed to unfollow user',
    'mint': 'Failed to mint NFT',
    'transfer': 'Failed to transfer NFT',
    'purchase': 'Failed to complete purchase',
    'authenticate': 'Failed to connect wallet',
  };
  
  const context = actionContext[action.toLowerCase()] || `Failed to ${action}`;
  return `${context}: ${baseMessage}`;
};