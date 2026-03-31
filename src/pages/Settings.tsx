import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings as SettingsIcon, User, Bell, Palette, Shield, HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLens } from '../hooks/useLens';
import { useFlow } from '../hooks/useFlow';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

const Settings = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { logout: lensLogout } = useLens();
  const { disconnect: flowDisconnect } = useFlow();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    try {
      await Promise.all([
        signOut(),
        lensLogout(),
        flowDisconnect()
      ]);
      toast.success('Signed out successfully');
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out completely');
      console.error('Sign out error:', error);
    }
  };

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/profile"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
          <div className="flex items-center mb-4">
            <SettingsIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Settings</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Manage your account preferences and app settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" />
              Account
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white">Profile Information</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Update your name, email, and profile picture</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white">Connected Accounts</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage Web3 wallet and social connections</p>
              </button>
              <button 
                onClick={handleSignOut}
                className="w-full text-left px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-red-600 dark:text-red-400">Sign Out</p>
                  <p className="text-sm text-red-500/70 dark:text-red-400/70">Disconnect from all associated accounts</p>
                </div>
                <LogOut className="h-5 w-5 text-red-500 dark:text-red-400" />
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notifications
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure reminder and update alerts</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white">Email Preferences</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Manage newsletter and marketing emails</p>
              </button>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Appearance
            </h2>
            <div className="space-y-3">
              <button 
                onClick={cycleTheme}
                className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Current: {theme?.charAt(0).toUpperCase()}{theme?.slice(1) || 'System'}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy & Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="mr-2 h-5 w-5" />
              Privacy & Security
            </h2>
            <div className="space-y-3">
              <Link
                to="/privacy"
                className="block w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">Privacy Policy</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View our privacy policy</p>
              </Link>
              <Link
                to="/terms"
                className="block w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">Terms of Service</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">View our terms of service</p>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              Help & Support
            </h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white">FAQ</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Frequently asked questions</p>
              </button>
              <button className="w-full text-left px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <p className="font-medium text-gray-900 dark:text-white">Contact Support</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get help from our team</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          <p>Imperfect Breath v1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
