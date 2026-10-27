/**
 * The Carousel and its hand-off (tickets 12 and 19).
 *
 * ADR-0004 governs the shape of this component: `navigator.share()` gets five
 * seconds of transient activation and consumes it, and six to ten Slides do not
 * render inside that. So the Carousel is built ahead of time, the control stays
 * disabled until it is ready, and the share handler contains the `share()` call
 * and nothing else. Do not "optimise" by moving generation into the handler —
 * it works on a desktop browser and fails on every phone this runs on.
 *
 * ADR-0003 governs the copy: this is a *save*, not a post. Instagram appearing
 * in the sheet is a bonus we never promise.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Event, Tasting } from "../domain/types";
import { carouselImpressions } from "../taster/tasting";
import { composeCarousel, slideCount, MAX_FILES } from "./compose";
import { CoverSlide, PourSlide, SLIDE_H, SLIDE_W } from "./Slides";
import { captureSlide, slideFilename } from "./render";
import { checkShareLimits, formatBytes } from "../share/limits";

type Phase =
  | { kind: "empty" }
  | { kind: "rendering"; done: number; total: number }
  | { kind: "ready"; files: File[] }
  | { kind: "failed"; message: string };

export function ShareCard({ event, tasting }: { event: Event; tasting: Tasting }) {
  const rated = carouselImpressions(tasting, event.lineup);
  const carousel = composeCarousel(rated);
  const total = slideCount(carousel);

  const stageRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "empty" });
  const [shared, setShared] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  // pourId -> pre-decoded blob URL, resolved just before each Slide is
  // captured (never a raw server URL, and never via an <img> tag — see
  // Slides.tsx's header comment on the WebKit decode race).
  const [resolvedImages, setResolvedImages] = useState<Readonly<Record<string, string>>>({});

  // Anything that changes a Slide invalidates the Carousel and forces a
  // re-render before sharing is possible again (ADR-0004).
  const signature = JSON.stringify({
    cover: carousel.includeCover,
    name: tasting.firstName,
    event: event.name,
    slides: carousel.impressions.map((i) => [i.pourId, i.ratings, i.descriptors, i.note]),
  });

  useEffect(() => {
    if (total === 0) {
      setPhase({ kind: "empty" });
      return;
    }
    let live = true;
    setShared(false);
    setShareError(null);
    setPhase({ kind: "rendering", done: 0, total });

    const run = async () => {
      // Resolve every bottle image to a pre-decoded blob URL BEFORE capture
      // starts. Each image gets its own try/catch: a failed fetch/decode
      // degrades that one Slide to rendering with no image, never blocks or
      // fails the whole Carousel.
      const images: Record<string, string> = {};
      for (const impression of carousel.impressions) {
        const url = impression.pour.imageUrl;
        if (!url) continue;
        try {
          let response: Response | undefined;
          if (typeof caches !== "undefined") {
            const cache = await caches.open("bottle-images").catch(() => null);
            if (cache) response = await cache.match(url);
          }
          if (!response) response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.src = blobUrl;
          await img.decode();
          images[impression.pourId] = blobUrl;
        } catch {
          /* no image for this Slide; the Slide still renders fine without it */
        }
      }
      if (!live) return;
      setResolvedImages(images);
      // Wait for the stage to actually lay out (and the new image styles to
      // apply) before capturing it.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      const stage = stageRef.current;
      if (!stage) return;
      const nodes = Array.from(stage.querySelectorAll<HTMLElement>("[data-slide]"));

      const files: File[] = [];
      for (const [index, node] of nodes.entries()) {
        if (!live) return;
        try {
          files.push(await captureSlide(node, slideFilename(index)));
        } catch (error) {
          if (!live) return;
          setPhase({
            kind: "failed",
            message: error instanceof Error ? error.message : "Falha ao gerar as imagens",
          });
          return;
        }
        if (live) setPhase({ kind: "rendering", done: index + 1, total });
        // Yield so the progress paints on a phone.
        await new Promise((r) => setTimeout(r, 0));
      }
      if (live) setPhase({ kind: "ready", files });
    };

    void run();
    return () => {
      live = false;
    };
  }, [signature, total]);

  /** ADR-0004: this handler contains the share call and nothing else. */
  const share = useCallback(async () => {
    if (phase.kind !== "ready") return;
    setShareError(null);
    try {
      await navigator.share({ files: phase.files });
      setShared(true);
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "AbortError") return; // dismissed the sheet; not a failure
      setShareError("Não foi possível abrir o compartilhamento. Toque de novo, ou baixe as imagens.");
    }
  }, [phase]);

  if (total === 0) {
    return (
      <Wrap>
        <h2 style={h2}>Nenhum vinho avaliado ainda</h2>
        <p style={body}>Volte a qualquer momento — nada se perde.</p>
      </Wrap>
    );
  }

  const limits = phase.kind === "ready" ? checkShareLimits(phase.files) : null;
  // canShare() only checks the array is non-empty, so it cannot gate this
  // (ticket 01). Detect the API, check the limits ourselves, and catch.
  const canUseShare = typeof navigator.share === "function";

  return (
    <Wrap>
      <h2 style={h2}>
        {rated.length} {rated.length === 1 ? "vinho avaliado" : "vinhos avaliados"}
      </h2>
      <p style={body}>
        {tasting.firstName
          ? `Suas imagens saem assinadas com “${tasting.firstName}”.`
          : "Suas imagens saem sem assinatura."}
        {carousel.truncated && ` Só os ${MAX_FILES} primeiros cabem em um carrossel.`}
      </p>

      {phase.kind === "rendering" && (
        <>
          <button disabled style={{ ...btn, ...btnMuted }}>
            Preparando suas imagens… {phase.done}/{phase.total}
          </button>
          <p style={hint}>Um instante — estamos montando o carrossel.</p>
        </>
      )}

      {phase.kind === "failed" && (
        <>
          <button onClick={() => window.location.reload()} style={{ ...btn, ...btnLight }}>
            Tentar de novo
          </button>
          <p style={{ ...hint, color: "#fca5a5" }}>{phase.message}</p>
        </>
      )}

      {phase.kind === "ready" && (
        <>
          {canUseShare && (
            <button onClick={() => void share()} style={{ ...btn, ...btnLight }}>
              Salvar {phase.files.length} {phase.files.length === 1 ? "imagem" : "imagens"}
            </button>
          )}

          {(!canUseShare || shareError) && (
            <div style={{ marginTop: canUseShare ? 12 : 0 }}>
              {!canUseShare && (
                <p style={{ ...hint, marginTop: 0, marginBottom: 10 }}>
                  Este navegador não abre o compartilhamento. Baixe as imagens
                  uma a uma e poste pelo aplicativo do Instagram.
                </p>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {phase.files.map((file, i) => (
                  <a
                    key={file.name}
                    href={URL.createObjectURL(file)}
                    download={file.name}
                    style={downloadLink}
                  >
                    {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {shareError && <p style={{ ...hint, color: "#fca5a5" }}>{shareError}</p>}

          {shared && (
            <div style={instructions}>
              <strong style={{ display: "block", marginBottom: 8, fontSize: 14 }}>
                Salvou? Agora é rápido:
              </strong>
              1. Abra o Instagram e toque em <b>+</b>
              <br />
              2. Escolha as {phase.files.length} imagens na ordem
              <br />
              3. Publique — pronto 🍷
            </div>
          )}

          {limits && !limits.withinChromiumLimits && (
            <p style={{ ...hint, color: "#fca5a5" }}>
              As imagens somam {formatBytes(limits.totalBytes)} e podem não caber
              em um compartilhamento só. Baixe uma a uma se falhar.
            </p>
          )}
        </>
      )}

      {/*
        The stage. Rendered off-screen rather than hidden: snapdom needs real
        layout, so display:none would produce blank Slides.
        `position: fixed` (not "absolute") is deliberate: this stage can be
        several thousand px tall (SLIDE_H * total slides), and an absolutely
        positioned element still contributes to the document's scrollable
        overflow even when shifted far off-screen via `left`, which made the
        whole page scroll into acres of blank space once this mounted. Fixed
        positioning is relative to the viewport and never expands document
        scroll/layout bounds, while still giving snapdom the real layout it
        needs to capture.
      */}
      <div
        ref={stageRef}
        aria-hidden
        style={{
          position: "fixed", left: -20000, top: 0,
          width: SLIDE_W, height: SLIDE_H * Math.max(total, 1),
          pointerEvents: "none",
        }}
      >
        {carousel.includeCover && (
          <div data-slide="cover">
            <CoverSlide
              eventName={event.name}
              date={event.date}
              firstName={tasting.firstName}
              count={carousel.impressions.length}
            />
          </div>
        )}
        {carousel.impressions.map((impression, index) => (
          <div data-slide={impression.pourId} key={impression.pourId}>
            <PourSlide impression={impression} index={index} imageUrl={resolvedImages[impression.pourId]} />
          </div>
        ))}
      </div>
    </Wrap>
  );
}

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "100%", maxWidth: 330, textAlign: "center", position: "relative" }}>
    {children}
  </div>
);

const h2: React.CSSProperties = { fontSize: 24, margin: "0 0 10px" };
const body: React.CSSProperties = {
  fontSize: 14, color: "rgba(250,250,249,.6)", lineHeight: 1.5, margin: "0 0 4px",
};
const hint: React.CSSProperties = {
  fontSize: 11.5, color: "rgba(250,250,249,.45)", marginTop: 10, lineHeight: 1.5,
};
const btn: React.CSSProperties = {
  width: "100%", marginTop: 20, padding: 16, borderRadius: 12,
  border: 0, fontSize: 15, fontWeight: 700,
};
const btnLight: React.CSSProperties = { background: "#fafaf9", color: "#1c1917" };
const btnMuted: React.CSSProperties = {
  background: "rgba(250,250,249,.14)", color: "rgba(250,250,249,.55)",
};
const downloadLink: React.CSSProperties = {
  display: "grid", placeItems: "center", width: 42, height: 42,
  borderRadius: 10, border: "1px solid rgba(250,250,249,.28)",
  color: "#fafaf9", textDecoration: "none", fontSize: 13, fontWeight: 700,
};
const instructions: React.CSSProperties = {
  marginTop: 16, padding: "14px 16px", borderRadius: 12, textAlign: "left",
  background: "rgba(250,250,249,.07)", border: "1px solid rgba(250,250,249,.14)",
  fontSize: 13.5, lineHeight: 1.7, color: "rgba(250,250,249,.85)",
};
