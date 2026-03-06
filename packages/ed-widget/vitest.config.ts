import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["test/**/*.test.ts"],
    css: false,
  },
  // Override postcss to avoid autoprefixer dependency in tests
  css: {
    postcss: {
      plugins: [],
    },
  },
});
