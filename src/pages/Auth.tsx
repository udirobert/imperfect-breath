/**
 * ENHANCED Auth Page - Uses UnifiedAuthFlow
 * 
 * ENHANCEMENT FIRST: Replaced duplicate auth logic with enhanced UnifiedAuthFlow
 * AGGRESSIVE CONSOLIDATION: Removed redundant auth implementation
 * DRY: Single source of truth for auth flows
 */

import { useNavigate, useSearchParams } from 'react-router-dom';
import { UnifiedAuthFlow } from '@/components/auth/UnifiedAuthFlow';
import { toast } from 'sonner';
import type { AuthContext } from '@/auth';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // ORGANIZED: Extract context from URL params
  const context: AuthContext = {
    type: (searchParams.get('context') as AuthContext['type']) || 'profile',
    source: searchParams.get('source') || undefined,
  };
  
  const handleAuthComplete = (authType?: string) => {
    // CLEAN: Contextual success messages
    const messages = {
      guest: 'Welcome! You can start breathing immediately.',
      email: 'Successfully signed in! Your progress will be saved.',
      wallet: 'Wallet connected! You now have access to all features.',
    };
    
    if (authType && messages[authType as keyof typeof messages]) {
      toast.success(messages[authType as keyof typeof messages]);
    }
    
    // ORGANIZED: Context-aware navigation
    const redirectTo = searchParams.get('redirect') || '/';
    navigate(redirectTo);
  };

  return (
    <div className="flex items-center justify-center min-h-full animate-fade-in p-4">
      <UnifiedAuthFlow
        // MODULAR: Enable blockchain features for full auth experience
        features={{ blockchain: true }}
        context={context}
        onComplete={handleAuthComplete}
        // PERFORMANT: Use contextual mode for focused experience
        mode={context.type === 'profile' ? 'full' : 'contextual'}
      />
    </div>
  );
};

export default Auth;
