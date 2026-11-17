import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { vitePrerenderPlugin } from "vite-prerender-plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Configuração para suportar __dirname em ambientes ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const proxy = {
  "/api": "http://localhost:3001",
  "/uploads": "http://localhost:3001",
};

export default defineConfig(({ mode }) => {
  let build: UserConfig["build"] = {};
  let esbuild: UserConfig["esbuild"] = {};
  let define: UserConfig["define"] = {};

  if (mode === "development") {
    build = {
      minify: false,
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    };

    esbuild = {
      keepNames: true,
      minifyIdentifiers: false,
    };

    define = {
      "process.env.NODE_ENV": '"development"',
      __DEV__: "true",
    };
  }

  return {
    plugins: [
      react(),
       vitePrerenderPlugin({
         renderTarget: '#root',
         prerenderScript: path.resolve(__dirname, 'src/prerender.tsx'),
       }),
    ],

    build,
    esbuild,
    define,

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },

    // Proxy utilizado pelo npm run dev
    server: {
      proxy,
    },

    // Proxy utilizado pelo npm run preview
    preview: {
      proxy,
    },

    optimizeDeps: {
      include: ["lucide-react"],
    },
  };
});
