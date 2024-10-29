import { defineConfig } from "@solidjs/start/config";

console.log("process.env.BASE_PATH", process.env.BASE_PATH);

export default defineConfig({
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
