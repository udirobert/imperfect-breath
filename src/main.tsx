// Polyfills for Node.js compatibility in browser
declare global {
  interface Window {
    global: typeof globalThis;
    process: { env: Record<string, string>; browser: boolean };
    module: { exports: Record<string, unknown> };
    exports: Record<string, unknown>;
    require: (id: string) => unknown;
  }
}

(window as Window & typeof globalThis).global = globalThis;
(window as Window & typeof globalThis).process = { env: {}, browser: true };

// Add module polyfill for CommonJS compatibility
(window as Window & typeof globalThis).module = { exports: {} };
(window as Window & typeof globalThis).exports = (
  window as Window & typeof globalThis
).module.exports;

// Add comprehensive Node.js module polyfills
if (typeof (window as Window & typeof globalThis).require === "undefined") {
  (window as Window & typeof globalThis).require = (id: string) => {
    // Common Node.js modules that need browser polyfills
    const polyfills: Record<string, unknown> = {
      fs: {
        readFileSync: () => {
          throw new Error("fs.readFileSync not available in browser");
        },
        writeFileSync: () => {
          throw new Error("fs.writeFileSync not available in browser");
        },
        existsSync: () => false,
        mkdirSync: () => {
          throw new Error("fs.mkdirSync not available in browser");
        },
      },
      path: {
        join: (...parts: string[]) => parts.join("/"),
        resolve: (...parts: string[]) => parts.join("/"),
        dirname: (path: string) => path.split("/").slice(0, -1).join("/"),
        basename: (path: string) => path.split("/").pop() || "",
        extname: (path: string) => {
          const parts = path.split(".");
          return parts.length > 1 ? "." + parts.pop() : "";
        },
      },
      os: {
        platform: () => "browser",
        type: () => "Browser",
        homedir: () => "/",
        tmpdir: () => "/tmp",
      },
      crypto: window.crypto,
      util: {
        inspect: (obj: unknown) => JSON.stringify(obj),
        format: (f: string, ...args: unknown[]) =>
          f.replace(/%[sdj%]/g, () => args.shift()),
      },
      dotenv: {
        config: () => ({
          parsed: {},
          error: null,
        }),
      },
    };

    if (polyfills[id]) {
      return polyfills[id];
    }

    // For unknown modules, return empty object instead of throwing
    console.warn(`Module "${id}" polyfilled with empty object`);
    return {};
  };
}

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
