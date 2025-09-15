import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

/**
 * Production-Safe Chunking Strategy
 * 
 * CORE PRINCIPLE: React must NEVER be separated from main bundle
 * to prevent "Cannot read properties of undefined (reading 'createContext')" errors
 */
const getChunkName = (id: string): string | undefined => {
  // CRITICAL: React ecosystem stays in main bundle for stability
  if (id.includes('react') || 
      id.includes('scheduler') || 
      id.includes('jsx') ||
      id.includes('React') ||
      id.includes('@types/react')) {
    return undefined; // Keep in main bundle
  }
  
  // Safe independent libraries that can be chunked
  if (id.includes('@tensorflow/tfjs-core') || 
      id.includes('@tensorflow/tfjs-backend') ||
      id.includes('@tensorflow/tfjs-converter')) {
    return 'tensorflow-core';
  }
  
  if (id.includes('@tensorflow-models')) {
    return 'tensorflow-models';
  }
  
  if (id.includes('date-fns') || 
      id.includes('uuid') || 
      id.includes('lodash')) {
    return 'vendor-utils';
  }
  
  // Conservative default: keep everything else in main bundle
  return undefined;
};

/**
 * Vite Configuration - Production Optimized
 * 
 * Key principles:
 * - React stability: Never separate React from main bundle
 * - Performance: Optimized chunking and minification
 * - Security: Clean path aliases and disabled source maps in production
 * - Compatibility: Node.js polyfills for blockchain libraries
 */
export default defineConfig(({ mode }) => {
  const isProduction = mode === "production";

  console.log(`Building for ${mode} mode`);

  return {
    plugins: [
      // Configure React plugin with simpler settings to avoid dependency issues
      react({
        // Force React to be bundled properly and prevent ReactCurrentOwner errors
        jsxRuntime: "automatic",
        // Include all React packages to ensure proper initialization
        include: "**/*.{jsx,tsx}",
      }),

      // Add Node.js polyfills for browser compatibility
      nodePolyfills({
        // Polyfill only what's needed
        include: ["buffer", "process", "util", "events"],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],

    // Configure path aliases to match tsconfig
    resolve: {
      alias: {
        "@": resolve(__dirname, "./src"),
        components: resolve(__dirname, "./src/components"),
        hooks: resolve(__dirname, "./src/hooks"),
        lib: resolve(__dirname, "./src/lib"),
        integrations: resolve(__dirname, "./src/integrations"),
        types: resolve(__dirname, "./src/types"),
        pages: resolve(__dirname, "./src/pages"),
        utils: resolve(__dirname, "./src/utils"),
        // Remove React aliases to prevent bundling issues
        // react: resolve(__dirname, "./node_modules/react"),
        // "react-dom": resolve(__dirname, "./node_modules/react-dom"),
      },
    },

    // Production-optimized build configuration
    build: {
      // Source maps: hidden in production for security, visible in development
      sourcemap: isProduction ? "hidden" : true,

      // Production minification
      ...(isProduction
        ? {
            minify: "terser",
            terserOptions: {
              compress: {
                drop_console: false, // Keep for production debugging
                drop_debugger: true,
              },
            },
          }
        : {}),

      // Chunking configuration to prevent bundle splitting issues
      chunkSizeWarningLimit: 10000,
      target: 'esnext',

      // Rollup options for build optimization
      rollupOptions: {
        // Ensure nothing gets externalized - everything should be bundled
        external: [],
        output: {
          // Simplified chunking strategy to prevent module loading issues
          manualChunks: {
            // Keep React ecosystem together in vendor chunk
            vendor: [
              'react',
              'react-dom',
              'react-dom/client',
              'react/jsx-runtime',
              'react-router-dom',
              'scheduler'
            ],
            // UI libraries in separate chunk
            ui: [
              '@radix-ui/react-slot',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              'class-variance-authority',
              'clsx',
              'tailwind-merge'
            ]
          },
          
          // Configure chunk file naming with better cache busting
          chunkFileNames: 'js/[name]-[hash:8].js',
          entryFileNames: 'js/[name]-[hash:8].js',
          
          // Configure asset file naming
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) {
              return 'assets/[name]-[hash:8][extname]';
            }
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'img/[name]-[hash:8][extname]';
            }
            if (/css/i.test(ext)) {
              return 'css/[name]-[hash:8][extname]';
            }
            return 'assets/[name]-[hash:8][extname]';
          },
        },
      },

      // Ensure we generate proper HTML
      emptyOutDir: true,
    },

    // Add custom defines for consistent behavior
    define: {
      // Ensure React production mode is properly set
      ...(isProduction
        ? {
            "process.env.NODE_ENV": JSON.stringify("production"),
            global: "globalThis",
          }
        : {}),
    },

    // Configure server options
    server: {
      port: 4556,
      open: true,
      strictPort: false,
    },

    // Configure web workers
    worker: {
      format: 'es',
      plugins: () => [
        // Apply the same plugins to workers
        react({
          jsxRuntime: "automatic",
          include: "**/*.{jsx,tsx}",
        }),
      ],
    },

    // Configure preview server (for testing production builds locally)
    preview: {
      port: 4173,
      open: true,
    },

    // React-specific optimizations - ensure React is always in main bundle
    optimizeDeps: {
      // Force React and related dependencies to be properly optimized
      force: true,
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react-router-dom",
        "scheduler", // React scheduler should also be optimized
        "zustand",
        "@tanstack/react-query"
      ],
      // Exclude optional dependencies that may not be available
      exclude: [
        "@tensorflow/tfjs-backend-webgpu",
        "@mediapipe/pose",
        "@mediapipe/camera_utils",
        "@mediapipe/control_utils",
        "@mediapipe/drawing_utils",
        "@lens-chain/sdk",
        "@lens-chain/storage-client"
      ],
    },

    // Ensure proper HMR behavior
    css: {
      devSourcemap: true,
    },
  };
});
