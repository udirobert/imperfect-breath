import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// MODULAR: Extract chunking logic for better composability
const getChunkName = (id: string): string | undefined => {
  // Core vendor libraries (stable packages only)
  if (id.includes('react') && !id.includes('react-router') && !id.includes('@radix-ui')) {
    return 'vendor-react';
  }
  if (id.includes('react-dom') && !id.includes('@radix-ui')) {
    return 'vendor-react';
  }
  if (id.includes('react-router-dom')) {
    return 'vendor-react';
  }
  
  // Radix UI components
  if (id.includes('@radix-ui')) {
    return 'vendor-ui';
  }
  
  // Crypto/Web3 libraries
  if (id.includes('@wagmi') || id.includes('viem') || id.includes('wagmi') || id.includes('connectkit')) {
    return 'vendor-crypto';
  }
  
  // State management
  if (id.includes('zustand')) {
    return 'vendor-state';
  }
  
  // TensorFlow core and backends
  if (id.includes('@tensorflow/tfjs') && !id.includes('models')) {
    return 'tensorflow-core';
  }
  
  // TensorFlow models (separate for lazy loading)
  if (id.includes('@tensorflow-models') || id.includes('@vladmandic/face-api')) {
    return 'tensorflow-models';
  }
  
  // Large AI/ML libraries
  if (id.includes('@anthropic-ai') || id.includes('@google/generative-ai') || id.includes('openai')) {
    return 'vendor-ai';
  }
  
  // Lens Protocol
  if (id.includes('@lens-protocol') || id.includes('@lens-chain')) {
    return 'vendor-lens';
  }
  
  // Flow blockchain
  if (id.includes('@onflow')) {
    return 'vendor-flow';
  }
  
  // Utility libraries
  if (id.includes('date-fns') || id.includes('uuid') || id.includes('@tanstack/react-query') || id.includes('lodash')) {
    return 'vendor-utils';
  }
  
  // Other vendor packages
  if (id.includes('node_modules')) {
    return 'vendor-misc';
  }
  
  return undefined;
};

// https://vitejs.dev/config/
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

    // Optimization settings for production
    build: {
      // Ensure sourcemaps for debugging
      sourcemap: isProduction ? "hidden" : true,

      // Apply optimizations only in production
      ...(isProduction
        ? {
            // Production-specific settings
            minify: "terser",
            terserOptions: {
              compress: {
                drop_console: false, // Keep console for production debugging
                drop_debugger: true,
              },
            },
          }
        : {}),

      // Common build settings
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1500, // Set a reasonable limit for chunks
      
      // Target modern browsers for better optimization
      target: 'esnext',

      // Rollup options for build optimization
      rollupOptions: {
        output: {
          manualChunks: getChunkName,
          
          // Configure chunk file naming
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
            return `js/[name]-[hash].js`;
          },
          
          // Configure asset file naming
          assetFileNames: (assetInfo) => {
            if (!assetInfo.name) {
              return `assets/[name]-[hash][extname]`;
            }
            
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `img/[name]-[hash][extname]`;
            }
            if (/css/i.test(ext)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
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

    // React-specific optimizations
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react-router-dom",
        "zustand",
        "@tensorflow/tfjs",
        "@tensorflow/tfjs-core",
        "@tensorflow/tfjs-backend-webgl",
        "@tensorflow/tfjs-backend-cpu",
        "@tensorflow-models/face-landmarks-detection",
        "@tensorflow-models/pose-detection",
        "@tensorflow-models/blazeface",
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
