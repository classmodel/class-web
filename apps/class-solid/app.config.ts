import { defineConfig } from "@solidjs/start/config";
import wasm from "vite-plugin-wasm";

console.log("process.env.BASE_PATH", process.env.BASE_PATH);

export default defineConfig({
  vite: {
    plugins: [wasm()],
  },
  ssr: false,
  server: {
    baseURL: process.env.BASE_PATH,
    static: true,
    prerender: {
      failOnError: true,
      routes: ["/"],
      crawlLinks: true,
    },
  },
});
