import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/webhooks/validate.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  target: "node18",
  splitting: true,
});
