import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy backend-proxy requests to the backend server
      '/backend-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Use our custom shims for problematic modules
      'eventemitter3': path.resolve(__dirname, './eventemitter3-shim.js'),
      'lodash/isNil': path.resolve(__dirname, './lodash-shim.js'),
      'lodash/isString': path.resolve(__dirname, './lodash-shim.js'),
      'lodash/isFunction': path.resolve(__dirname, './lodash-shim.js'),
      'lodash/isArray': path.resolve(__dirname, './lodash-shim.js'),
      'lodash/isObject': path.resolve(__dirname, './lodash-shim.js'),
      'lodash/get': path.resolve(__dirname, './lodash-shim.js'),
      'lodash/last': path.resolve(__dirname, './lodash-shim.js'),
      'long': path.resolve(__dirname, './long-shim.js'),
      'events': path.resolve(__dirname, './events-shim.js'),
    },
  },
  define: {
    // Better Node.js polyfills for browser environment
    'process.env': JSON.stringify({}),
    'process.cwd': JSON.stringify('() => ""'),
    'process.versions': JSON.stringify({ node: "16.0.0" }),
    'process.platform': JSON.stringify("browser"),
    'process.browser': JSON.stringify(true),
    'module': JSON.stringify({ exports: {} }),
    'global': 'window',
  },
  optimizeDeps: {
    // Exclude Story Protocol SDK from browser bundle
    exclude: ['@story-protocol/core-sdk'],
    esbuildOptions: {
      // Enable JSX in TS files
      jsx: 'automatic',
      // Define global variables for the build
      define: {
        global: 'globalThis',
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
    },
  },
  build: {
    sourcemap: true,
    // Increase chunk size warning limit to avoid warnings with large dependencies
    chunkSizeWarningLimit: 6000,
    commonjsOptions: {
      // Transform CommonJS modules to ES modules
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Override the problematic eventemitter3 resolution
      onwarn(warning, warn) {
        // Ignore specific warnings
        if (warning.code === 'CIRCULAR_DEPENDENCY') return;
        if (warning.message.includes('/*#__PURE__*/')) return;
        warn(warning);
      },
      output: {
        // Fix for the eventemitter3 circular import issue
        manualChunks(id) {
          if (id.includes('eventemitter3')) {
            return 'eventemitter3';
          }
        }
      }
    },
  },
}));
