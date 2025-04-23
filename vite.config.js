import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  define: {
    "process.env": {}, // Fixes issues with some dependencies expecting Node.js env
  },
  optimizeDeps: {
    include: [
      "lodash.debounce",
      "xlsx",
      "jspdf",
      "jspdf-autotable"
    ]
  }
});