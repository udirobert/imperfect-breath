import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// CONSERVATIVE CHUNKING: Only chunk libraries that are guaranteed safe
const getChunkName = (id: string): string | undefined => {
  // CRITICAL: Absolutely never chunk React or any React ecosystem packages
  // React, React DOM, JSX runtime, scheduler must all stay in main bundle
  if (id.includes('react') || 
      id.includes('scheduler') || 
      id.includes('jsx') ||
      id.includes('React') ||
      id.includes('@types/react')) {
    return undefined; // Force into main bundle
  }
  
  // Only chunk libraries that we know are completely independent of React
  // TensorFlow libraries - these are safe as they don't use React
  if (id.includes('@tensorflow/tfjs-core') || 
      id.includes('@tensorflow/tfjs-backend') ||
      id.includes('@tensorflow/tfjs-converter')) {
    return 'tensorflow-core';
  }
  
  // TensorFlow models - safe to chunk
  if (id.includes('@tensorflow-models')) {
    return 'tensorflow-models';
  }
  
  // Utility libraries that don't depend on React
  if (id.includes('date-fns') || 
      id.includes('uuid') || 
      id.includes('lodash')) {
    return 'vendor-utils';
  }
  
  // For everything else, be extremely conservative
  // Only chunk if we're absolutely certain it's safe
  
  return undefined; // Keep everything else in main bundle
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
      chunkSizeWarningLimit: 10000, // Increase limit to prevent automatic splitting
      
      // Target modern browsers for better optimization
      target: 'esnext',

      // Rollup options for build optimization
      rollupOptions: {
        // Ensure nothing gets externalized - everything should be bundled
        external: [],
        output: {
          // Force everything into a single vendor chunk
          manualChunks: {
            // Put all vendor dependencies in one chunk
            vendor: [
              'react',
              'react-dom',
              'react-dom/client',
              'react/jsx-runtime',
              'react-router-dom',
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-avatar',
              '@radix-ui/react-button',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slider',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              'zustand',
              '@tanstack/react-query',
              'date-fns',
              'uuid',
              'clsx',
              'class-variance-authority',
              'tailwind-merge'
            ]
          },
          
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
          
          // Remove globals as we want everything bundled
          // globals: {
          //   'react': 'React',
          //   'react-dom': 'ReactDOM'
          // }
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
