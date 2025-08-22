import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

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
        react: resolve(__dirname, "./node_modules/react"),
        "react-dom": resolve(__dirname, "./node_modules/react-dom"),
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
      chunkSizeWarningLimit: 2000, // Increase limit since we have better chunking now
      
      // Target modern browsers for better optimization
      target: 'esnext',

      // Rollup options for build optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Core vendor libraries (stable packages only)
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': [
              '@radix-ui/react-dialog', 
              '@radix-ui/react-select', 
              '@radix-ui/react-slot',
              '@radix-ui/react-toast'
            ],
            'vendor-crypto': ['@wagmi/core', 'viem', 'wagmi'],
            'vendor-state': ['zustand'],
            
            // TensorFlow core and backends (keep together to avoid initialization issues)
            'tensorflow-core': [
              '@tensorflow/tfjs',
              '@tensorflow/tfjs-core',
              '@tensorflow/tfjs-backend-webgl',
              '@tensorflow/tfjs-backend-cpu'
            ],
            
            // TensorFlow models (separate chunk for lazy loading)
            'tensorflow-models': [
              '@tensorflow-models/face-landmarks-detection',
              '@tensorflow-models/pose-detection',
              '@tensorflow-models/blazeface'
            ],
            
            // Utility libraries
            'vendor-utils': [
              'date-fns',
              'uuid',
              '@tanstack/react-query'
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
        "react/jsx-runtime",
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
