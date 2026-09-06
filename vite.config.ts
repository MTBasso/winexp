import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// The Cloudflare plugin goes after the framework plugin and needs no options —
// it finds wrangler.jsonc in the project root itself.
export default defineConfig({
  plugins: [react(), cloudflare()],
});
