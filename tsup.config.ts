import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"], // Your main component
  format: ["cjs", "esm"], // Output both CommonJS and ES modules
  dts: true, // Generate TypeScript declaration files
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom"], // Mark peer dependencies as external
});
