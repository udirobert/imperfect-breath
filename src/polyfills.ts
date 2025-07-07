// Polyfills for Node.js APIs that might be used by dependencies
// This helps prevent errors when libraries expect Node.js environment

// Polyfill for process
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    cwd: () => '',
    versions: { node: '16.0.0' },
    nextTick: (fn: Function) => setTimeout(fn, 0),
    platform: 'browser',
    browser: true,
  } as any;
}

// Polyfill for module and exports
if (typeof window !== 'undefined' && typeof (window as any).module === 'undefined') {
  (window as any).module = { exports: {} };
}

// Polyfill for require if needed by any dependencies
if (typeof window !== 'undefined' && !window.require) {
  const moduleCache: Record<string, any> = {
    fs: {
      readFileSync: () => '',
      existsSync: () => false,
      writeFileSync: () => {},
      mkdirSync: () => {},
    },
    path: {
      join: (...args: string[]) => args.join('/'),
      resolve: (...args: string[]) => args.join('/'),
      dirname: (path: string) => path.split('/').slice(0, -1).join('/'),
      basename: (path: string) => path.split('/').pop() || '',
    },
    os: {
      homedir: () => '/',
      platform: () => 'browser',
      tmpdir: () => '/tmp',
    },
    crypto: {
      randomBytes: (size: number) => new Uint8Array(size),
      createHash: () => ({
        update: () => ({ digest: () => '' }),
      }),
    },
  };

  window.require = function(moduleName: string) {
    console.warn(`Module "${moduleName}" was requested via require() but is not available in browser environment`);
    
    // Return mocked module if we have one
    if (moduleCache[moduleName]) {
      return moduleCache[moduleName];
    }

    // For package.json requests, return empty object
    if (moduleName.endsWith('package.json')) {
      return { version: '1.0.0' };
    }
    
    // Special case for dotenv
    if (moduleName === 'dotenv') {
      const dotenvMock = {
        config: function() {
          return { parsed: process.env || {} };
        },
        parse: function() { return {}; }
      };
      
      // Make sure it's properly callable directly
      Object.defineProperty(dotenvMock, "default", {
        enumerable: true,
        value: dotenvMock
      });
      
      // Also expose config as a property
      (dotenvMock.config as any).parsed = process.env || {};
      
      return dotenvMock;
    }
    
    // Default empty object
    return {};
  } as any;
}

// Add global type definitions
declare global {
  interface Window {
    process: any;
    require: any;
    module: any;
  }
}

export {};