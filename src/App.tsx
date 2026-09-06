import { ShareProbe } from "./devtools/ShareProbe";
import { PrototypeTaster } from "./prototypes/taster/PrototypeTaster";
import { PrototypeCarousel } from "./prototypes/carousel/PrototypeCarousel";
import { PrototypeOrganizer } from "./prototypes/organizer/PrototypeOrganizer";
import { PasscodeGate } from "./organizer/PasscodeGate";
import { OrganizerAdmin } from "./organizer/OrganizerAdmin";

/**
 * The Taster flow is not built yet — it is decided by tickets 04, 07 and 08 on
 * the wayfinder map, and inventing it here would be answering those tickets by
 * accident. Until then this shell exists to carry the ticket-13 share probe.
 */
export function App() {
  const path = window.location.pathname;
  if (path === "/share-probe") return <ShareProbe />;
  if (path === "/prototype/taster") return <PrototypeTaster />;
  if (path === "/prototype/carousel") return <PrototypeCarousel />;
  if (path === "/prototype/organizer") return <PrototypeOrganizer />;

  // The real Organizer admin (tickets 06, 09, 17).
  if (path === "/admin") {
    return (
      <PasscodeGate>
        <OrganizerAdmin />
      </PasscodeGate>
    );
  }

  return (
    <main
      style={{
        maxWidth: 460,
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily: "system-ui, sans-serif",
        color: "#1c1917",
        lineHeight: 1.55,
      }}
    >
      <h1 style={{ fontSize: 22, marginBottom: 10 }}>Degustação</h1>
      <p style={{ color: "#57534e", fontSize: 15 }}>
        Scaffold only. The Taster flow is still being decided — see{" "}
        <code>.scratch/wine-tasting-mvp/map.md</code>.
      </p>
      <p style={{ marginTop: 20, display: "grid", gap: 10 }}>
        <a href="/prototype/taster" style={{ color: "#7f1d1d", fontWeight: 600 }}>
          Taster flow prototype (ticket 04) →
        </a>
        <a href="/prototype/carousel" style={{ color: "#7f1d1d", fontWeight: 600 }}>
          Carousel prototype (ticket 08) →
        </a>
        <a href="/admin" style={{ color: "#7f1d1d", fontWeight: 700 }}>
          Área dos organizadores →
        </a>
        <a href="/prototype/organizer" style={{ color: "#7f1d1d", fontWeight: 600 }}>
          Organizer flow prototype (ticket 06) →
        </a>
        <a href="/share-probe" style={{ color: "#7f1d1d", fontWeight: 600 }}>
          Share probe (ticket 13) →
        </a>
      </p>
    </main>
  );
}
