import { defineConfig } from "@solidjs/start/config";
// import solidPlugin from "vite-plugin-solid";

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
  // vite: {
  //   plugins: [solidPlugin()],
  // },
});
