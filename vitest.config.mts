import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Vitest 4 resolves tsconfig `paths` (e.g. "@/*") natively.
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", ".agents", "project-kit", "research"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["app/**", "components/**", "lib/**", "design-system.ts"],
    },
  },
});
