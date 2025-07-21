import React from "react";
import { useAuth, AuthFeatures } from "../useAuth";

interface AuthGateProps {
  children: React.ReactNode;
  features?: AuthFeatures;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  className?: string;
}

interface AuthRequirement {
  key: string;
  label: string;
  isConnected: boolean;
  connect?: () => Promise<{ success: boolean; error?: string }>;
}

/**
 * Universal AuthGate - contextual authentication based on required features
 * Only loads and checks the auth features you specify
 */
export const AuthGate: React.FC<AuthGateProps> = ({
  children,
  features = {},
  fallback,
  requireAll = true,
  className,
}) => {
  const auth = useAuth(features);

  // Build requirements based on requested features
  const requirements: AuthRequirement[] = [];

  // Core auth requirement (always checked)
  requirements.push({
    key: "core",
    label: "Account",
    isConnected: auth.hasUser,
  });

  // Blockchain requirement (if requested)
  if (features.blockchain) {
    requirements.push({
      key: "blockchain",
      label: "Wallet",
      isConnected: auth.hasWallet,
      connect: auth.connectWallet,
    });
  }

  // Flow requirement (if requested)
  if (features.flow) {
    requirements.push({
      key: "flow",
      label: "Flow Account",
      isConnected: auth.hasFlowAccount,
      connect: auth.loginFlow,
    });
  }

  // Lens requirement (if requested)
  if (features.lens) {
    requirements.push({
      key: "lens",
      label: "Lens Profile",
      isConnected: auth.hasLensProfile,
    });
  }

  // Check if requirements are met
  const unmetRequirements = requirements.filter((req) => !req.isConnected);
  const hasAccess = requireAll
    ? unmetRequirements.length === 0
    : requirements.some((req) => req.isConnected);

  // Show loading state
  if (auth.isLoading) {
    return (
      <div className={`auth-gate-loading ${className || ""}`}>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

  // Show children if access granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Default auth prompt
  return (
    <div className={`auth-gate-prompt ${className || ""}`}>
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Authentication Required
        </h3>

        <p className="text-gray-600 mb-6">
          {requireAll
            ? "Please connect all required services to continue:"
            : "Please connect at least one of the following services:"}
        </p>

        <div className="space-y-3">
          {requirements.map((req) => (
            <div
              key={req.key}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                req.isConnected
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    req.isConnected ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="font-medium text-gray-900">{req.label}</span>
              </div>

              {!req.isConnected && req.connect && (
                <button
                  onClick={req.connect}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Connect
                </button>
              )}

              {req.isConnected && (
                <span className="text-sm text-green-600 font-medium">
                  Connected
                </span>
              )}
            </div>
          ))}
        </div>

        {!auth.hasUser && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Don't have an account?</p>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // TODO: Implement login modal/redirect
                  console.log("Login clicked");
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  // TODO: Implement register modal/redirect
                  console.log("Register clicked");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Convenience components for common use cases
export const BasicAuthGate: React.FC<Omit<AuthGateProps, "features">> = (
  props
) => <AuthGate {...props} features={{}} />;

export const Web3AuthGate: React.FC<Omit<AuthGateProps, "features">> = (
  props
) => <AuthGate {...props} features={{ blockchain: true }} />;

export const FlowAuthGate: React.FC<Omit<AuthGateProps, "features">> = (
  props
) => <AuthGate {...props} features={{ flow: true }} />;

export const FullAuthGate: React.FC<Omit<AuthGateProps, "features">> = (
  props
) => (
  <AuthGate
    {...props}
    features={{ blockchain: true, flow: true, lens: true }}
  />
);
