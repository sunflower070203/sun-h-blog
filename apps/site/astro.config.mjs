import react from "@astrojs/react";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://sun-h-blog.cn",
  output: "static",
  integrations: [react()],
  build: { inlineStylesheets: "never" },
});
