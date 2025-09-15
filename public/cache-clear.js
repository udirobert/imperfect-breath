/**
 * Cache Clear Utility
 * 
 * This script provides utilities to clear browser cache when loading issues occur.
 * Can be called manually or automatically when cache mismatches are detected.
 */

(function() {
  'use strict';

  // Create a global cache clearing utility
  window.clearAppCache = async function(options = {}) {
    const { 
      includeLocalStorage = false, 
      includeSessionStorage = false,
      showConfirmation = true,
      autoReload = true 
    } = options;

    console.log('Starting cache clear process...');

    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('Found caches:', cacheNames);
        
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
        console.log('Service worker caches cleared');
      }

      // Clear localStorage if requested
      if (includeLocalStorage && window.localStorage) {
        const localStorageKeys = Object.keys(localStorage);
        console.log('Clearing localStorage keys:', localStorageKeys);
        localStorage.clear();
      }

      // Clear sessionStorage if requested
      if (includeSessionStorage && window.sessionStorage) {
        const sessionStorageKeys = Object.keys(sessionStorage);
        console.log('Clearing sessionStorage keys:', sessionStorageKeys);
        sessionStorage.clear();
      }

      // Show confirmation
      if (showConfirmation) {
        console.log('Cache cleared successfully!');
      }

      // Auto-reload if requested
      if (autoReload) {
        console.log('Reloading page...');
        window.location.reload(true);
      }

      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  };

  // Create a diagnostic function
  window.diagnoseCacheIssues = function() {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      cacheSupport: 'caches' in window,
      serviceWorkerSupport: 'serviceWorker' in navigator,
      localStorageSupport: 'localStorage' in window,
      sessionStorageSupport: 'sessionStorage' in window,
      errors: window.__walletConfig ? window.__walletConfig.errors : [],
      buildTimestamp: localStorage.getItem('app_build_timestamp'),
      currentUrl: window.location.href,
      referrer: document.referrer
    };

    console.log('Cache diagnostics:', diagnostics);
    return diagnostics;
  };

  // Auto-detect and handle common cache issues
  window.addEventListener('error', function(event) {
    // Check for specific cache-related errors
    if (event.message && (
      event.message.includes('Loading chunk') ||
      event.message.includes('Failed to fetch dynamically imported module') ||
      event.message.includes('ChunkLoadError') ||
      event.message.includes('Loading CSS chunk')
    )) {
      console.warn('Cache-related loading error detected:', event.message);
      
      // Show user-friendly error message
      const errorDiv = document.createElement('div');
      errorDiv.id = 'cache-error-notification';
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fee;
        border: 1px solid #fca5a5;
        border-radius: 8px;
        padding: 16px;
        max-width: 400px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      `;
      
      errorDiv.innerHTML = `
        <div style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">
          ⚠️ Loading Error Detected
        </div>
        <div style="color: #374151; margin-bottom: 12px;">
          The app failed to load properly. This is usually fixed by clearing your browser cache.
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.clearAppCache()" style="background: #dc2626; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Clear Cache & Reload
          </button>
          <button onclick="document.getElementById('cache-error-notification').remove()" style="background: #6b7280; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 12px; cursor: pointer;">
            Dismiss
          </button>
        </div>
      `;
      
      // Remove any existing notification
      const existing = document.getElementById('cache-error-notification');
      if (existing) {
        existing.remove();
      }
      
      document.body.appendChild(errorDiv);
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (document.getElementById('cache-error-notification')) {
          document.getElementById('cache-error-notification').remove();
        }
      }, 10000);
    }
  });

  console.log('Cache clear utility loaded. Use window.clearAppCache() to manually clear cache.');
})();