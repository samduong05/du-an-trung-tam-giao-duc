import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@components": path.resolve(__dirname, "./src/components"),
        "@pages": path.resolve(__dirname, "./src/pages"),
        "@store": path.resolve(__dirname, "./src/store"),
        "@hooks": path.resolve(__dirname, "./src/hooks"),
        "@utils": path.resolve(__dirname, "./src/utils"),
        "@styles": path.resolve(__dirname, "./src/styles"),
      },
    },

    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:5000",
          changeOrigin: true,
        },
      },
    },

    build: {
      rollupOptions: {
        output: {
          manualChunks(moduleId) {
            const id = moduleId.replaceAll("\\", "/");

            if (!id.includes("/node_modules/")) {
              return undefined;
            }

            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/react-router-dom/")
            ) {
              return "vendor";
            }

            if (
              id.includes("/node_modules/@reduxjs/toolkit/") ||
              id.includes("/node_modules/react-redux/")
            ) {
              return "redux";
            }

            if (id.includes("/node_modules/recharts/")) {
              return "charts";
            }

            if (id.includes("/node_modules/framer-motion/")) {
              return "motion";
            }

            return undefined;
          },
        },
      },
    },
  };
});
