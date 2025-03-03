import { glob } from "node:fs/promises";
import { resolve } from "node:path";
import { type BuildEnvironmentOptions, defineConfig } from "vite";
import dts from "vite-plugin-dts";
import solidPlugin from "vite-plugin-solid";

async function findEntries() {
  const entries: Record<string, string> = {};
  for await (const path of glob("src/**/*.{ts,tsx}")) {
    if (
      path.includes("test") ||
      path.endsWith("App.tsx") ||
      path.endsWith("index.tsx")
    ) {
      continue;
    }
    entries[path.replace(/\.tsx?$/, "")] = resolve(__dirname, path);
  }
  return entries;
}
const entries = await findEntries();

// If BUILD_APP env var is truthy then build the app, otherwise build the library
const build_app = !!process.env.BUILD_APP;

const app_build: BuildEnvironmentOptions = {
  target: "esnext",
  outDir: "example-dist",
};
const lib_build: BuildEnvironmentOptions = {
  target: "esnext",
  minify: false,
  lib: {
    formats: ["es"],
    entry: entries,
  },
  rollupOptions: {
    // List of all dependencies, how they are imported in the source code
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
      "tailwindcss-animate",
    ],
  },
};

export default defineConfig({
  base: process.env.BASE_URL || "/",
  plugins: [solidPlugin(), dts({ exclude: ["**/App.*", "**/index.*"] })],
  resolve: {
    alias: {
      "~": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
  build: build_app ? app_build : lib_build,
});
