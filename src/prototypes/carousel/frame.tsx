/** PROTOTYPE — throwaway. True-size Slide, scaled down for preview. */
export const SLIDE_W = 1080;
export const SLIDE_H = 1350;
export const SCALE = 0.3;

export function Slide({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <div style={{ width: SLIDE_W * SCALE, height: SLIDE_H * SCALE, flex: "0 0 auto" }}>
      <div
        style={{
          width: SLIDE_W, height: SLIDE_H, background: bg,
          boxSizing: "border-box",
          transform: `scale(${SCALE})`, transformOrigin: "top left",
          overflow: "hidden", position: "relative",
          // Ticket 02: no <img> anywhere on a Slide — every raster image is a
          // WebKit decode race during capture. Type, colour and vector only.
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Strip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 16px 18px", scrollSnapType: "x mandatory" }}>
      {children}
    </div>
  );
}

/** Fonts must be self-hosted same-origin (ticket 02) — these stand in. */
export const SERIF = 'Georgia, "Times New Roman", serif';
export const SANS = 'system-ui, -apple-system, "Segoe UI", sans-serif';
