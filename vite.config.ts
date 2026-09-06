import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";

// The Cloudflare plugin goes after the framework plugin and needs no options —
// it finds wrangler.jsonc in the project root itself.
export default defineConfig({
  plugins: [react(), cloudflare()],
  server: {
    // Bind every interface rather than IPv6 loopback alone. Without this the
    // dev server listens on [::1] only, so a browser that resolves localhost to
    // 127.0.0.1 gets connection refused while curl (which tries IPv6 first)
    // succeeds. Also puts the prototypes on the LAN for phone testing.
    //
    // Note the share probe still needs HTTPS to have a secure context, so it
    // must be deployed rather than opened over http://<lan-ip>.
    host: true,
  },
});
