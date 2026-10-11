import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same-origin API in development, like production (where Express serves
    // the built app): run `npm run dev` in Backend/ alongside this.
    proxy: { "/api": "http://localhost:4000" },
  },
});
