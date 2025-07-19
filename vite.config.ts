import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  console.log(`Building for ${mode} mode`);
  
  return {
    plugins: [
      // Configure React plugin with simpler settings to avoid dependency issues
      react({
        // Force React to be bundled properly and prevent ReactCurrentOwner errors
        jsxRuntime: 'automatic',
        // Include all React packages to ensure proper initialization
        include: '**/*.{jsx,tsx}'
      }),
      
      // Add Node.js polyfills for browser compatibility
      nodePolyfills({
        // Polyfill only what's needed
        include: ['buffer', 'process', 'util', 'events'],
        globals: {
          Buffer: true,
          global: true,
          process: true
        }
      })
    ],
    
    // Configure path aliases to match tsconfig
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        'components': resolve(__dirname, './src/components'),
        'hooks': resolve(__dirname, './src/hooks'),
        'lib': resolve(__dirname, './src/lib'),
        'integrations': resolve(__dirname, './src/integrations'),
        'types': resolve(__dirname, './src/types'),
        'pages': resolve(__dirname, './src/pages'),
        'utils': resolve(__dirname, './src/utils'),
        'react': resolve(__dirname, './node_modules/react'),
        'react-dom': resolve(__dirname, './node_modules/react-dom')
      }
    },
    
    // Optimization settings for production
    build: {
      // Ensure sourcemaps for debugging
      sourcemap: isProduction ? 'hidden' : true,
      
      // Apply optimizations only in production
      ...(isProduction ? {
        // Production-specific settings
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: false, // Keep console for production debugging
            drop_debugger: true
          }
        }
      } : {}),
      
      // Common build settings
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1000,
      
      // Ensure we generate proper HTML
      emptyOutDir: true
    },
    
    // Add custom defines for consistent behavior
    define: {
      // Ensure React production mode is properly set
      ...(isProduction ? {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'global': 'globalThis'
      } : {})
    },
    
    // Configure server options
    server: {
      port: 3000,
      open: true,
      strictPort: false
    },
    
    // Configure preview server (for testing production builds locally)
    preview: {
      port: 4173,
      open: true
    },
    
    // React-specific optimizations
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react/jsx-runtime'
      ],
      // Force exclude problematic packages
      exclude: []
    },
    
    // Ensure proper HMR behavior
    css: {
      devSourcemap: true
    }
  };
});
