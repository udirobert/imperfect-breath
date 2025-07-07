import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Set NODE_ENV based on mode
  process.env.NODE_ENV = mode === 'production' ? 'production' : 'development';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        // Path aliases
        '@': path.resolve(__dirname, './src'),
        'src': path.resolve(__dirname, './src'),
        'components': path.resolve(__dirname, './src/components'),
        
        // Ensure React is properly resolved
        'react': path.resolve(__dirname, './node_modules/react'),
        'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
        'react-jsx-runtime': path.resolve(__dirname, './node_modules/react/jsx-runtime')
      }
    },
    build: {
      rollupOptions: {
        // Ensure React is properly externalized and not duplicated
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-jsx-runtime'],
          }
        }
      },
      sourcemap: mode !== 'production',
      // Better error reporting
      chunkSizeWarningLimit: 1000,
      minify: mode === 'production',
    },
    // Better error handling
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    }
  }
});
