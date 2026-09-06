/**
 * The Event API.
 *
 * Deliberately tiny: Impressions never reach a server (ADR-0002), so this only
 * ever serves Events and their Lineups, plus whatever the Organizer admin needs
 * to write. Navigation requests never reach here — static assets serve them
 * directly — so only /api/* costs a Worker invocation.
 *
 * The real routes wait on ticket 10 (data model) and ticket 05 (Event
 * lifecycle). This is the shell plus a health check.
 */
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return Response.json({ ok: true });
    }

    if (url.pathname.startsWith("/api/")) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Anything non-/api reaching the Worker is unexpected: assets handle it.
    return new Response("Not found", { status: 404 });
  },
} satisfies ExportedHandler;
