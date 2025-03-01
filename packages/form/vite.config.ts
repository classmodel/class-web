import path from "node:path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    target: "esnext",
    lib: {
      formats: ["es"],
      entry: [
        path.resolve(__dirname, "./src/Form.tsx"),
        path.resolve(__dirname, "./src/utils.ts"),
      ],
    },
    rollupOptions: {
      external: [
        "@kobalte/core", 
        "@kobalte/core/accordion",
        "@kobalte/core/button",
        "@kobalte/core/checkbox",
        "@kobalte/core/polymorphic",
        "@kobalte/core/text-field",
        "@kobalte/core/tooltip",
        "ajv",
        "ajv/dist/2020",
        "ajv/dist/2020.js",
        "class-variance-authority",
        "clsx",
        "solid-js",
        "solid-js/store",
        "tailwind-merge",
        "tailwindcss-animate"
      ]
    }
  },
});
