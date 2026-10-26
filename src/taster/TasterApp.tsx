/**
 * Where a QR scan lands: /e/:code.
 *
 * Fetches the Event once, caches it, and falls back to the cache when the
 * network is gone. A Taster who has opened this page once can rate all evening
 * with no connectivity at all.
 */
import { useCallback, useEffect, useState } from "react";
import type { Event, Pour } from "../domain/types";
import { ApiError, fetchEvent } from "../api/client";
import { isValidEventCode, normaliseEventCode } from "../domain/eventCode";
import { cacheBottleImages, cacheEvent, cachedEvent } from "./eventCache";
import { loadTasting, saveTasting, upsertImpression } from "./tasting";
import type { Tasting } from "../domain/types";
import type { RatingChange } from "./RatingSheet";
import { Deck } from "./Deck";

type State =
  | { kind: "loading" }
  | { kind: "ready"; event: Event; offline: boolean }
  | { kind: "missing" }
  | { kind: "invalid" }
  | { kind: "error"; message: string };

export function TasterApp({ rawCode }: { rawCode: string }) {
  const code = normaliseEventCode(rawCode);
  const [state, setState] = useState<State>({ kind: "loading" });
  const [tasting, setTasting] = useState<Tasting | null>(null);

  useEffect(() => {
    if (!isValidEventCode(rawCode)) {
      setState({ kind: "invalid" });
      return;
    }
    setTasting(loadTasting(code));

    let live = true;
    void fetchEvent(code)
      .then((event) => {
        if (!live) return;
        cacheEvent(event);
        void cacheBottleImages(event); // fire-and-forget: never blocks rendering
        setState({ kind: "ready", event, offline: false });
      })
      .catch((error: unknown) => {
        if (!live) return;
        // A 404 is a real answer; anything else may just be bad venue wifi, so
        // fall back to whatever this device already knows.
        if (error instanceof ApiError && error.status === 404) {
          setState({ kind: "missing" });
          return;
        }
        const cached = cachedEvent(code);
        if (cached) {
          setState({ kind: "ready", event: cached, offline: true });
          return;
        }
        setState({
          kind: "error",
          message: error instanceof ApiError ? error.message : "Não foi possível carregar",
        });
      });

    return () => {
      live = false;
    };
  }, [code, rawCode]);

  const persist = useCallback((next: Tasting) => {
    setTasting(next);
    saveTasting(next);
  }, []);

  const onName = useCallback(
    (firstName: string | null) => {
      setTasting((prev) => {
        if (!prev) return prev;
        const next = { ...prev, firstName };
        saveTasting(next);
        return next;
      });
    },
    [],
  );

  const onRate = useCallback((pour: Pour, change: RatingChange) => {
    setTasting((prev) => {
      if (!prev) return prev;
      const next = upsertImpression(prev, pour, change);
      saveTasting(next);
      return next;
    });
  }, []);

  if (state.kind === "loading") return <Centre>Carregando…</Centre>;

  if (state.kind === "invalid") {
    return (
      <Centre>
        <Title>Código inválido</Title>
        <Body>Confira o código impresso na mesa — são seis caracteres.</Body>
      </Centre>
    );
  }

  if (state.kind === "missing") {
    return (
      <Centre>
        <Title>Degustação não encontrada</Title>
        <Body>
          O código <Mono>{code}</Mono> não existe. Confira o que está impresso na
          mesa, ou peça ajuda a quem organizou.
        </Body>
      </Centre>
    );
  }

  if (state.kind === "error") {
    return (
      <Centre>
        <Title>Não foi possível carregar</Title>
        <Body>{state.message}. Tente de novo em instantes.</Body>
        <button onClick={() => window.location.reload()} style={retryBtn}>Tentar de novo</button>
      </Centre>
    );
  }

  if (state.event.lineup.length === 0) {
    return (
      <Centre>
        <Title>{state.event.name}</Title>
        <Body>
          A lista de vinhos ainda não foi publicada. Volte daqui a pouco — quem
          organiza ainda está montando.
        </Body>
      </Centre>
    );
  }

  if (!tasting) return <Centre>Carregando…</Centre>;

  return (
    <>
      {state.offline && (
        <div style={offlineBar}>Sem conexão — suas avaliações continuam sendo salvas neste aparelho.</div>
      )}
      <Deck event={state.event} tasting={tasting} onName={onName} onRate={onRate} />
    </>
  );
}

const Centre = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    minHeight: "100vh", background: "#1c1917", color: "#fafaf9",
    display: "grid", placeItems: "center", padding: 28,
    fontFamily: "system-ui, sans-serif", textAlign: "center",
  }}>
    <div style={{ maxWidth: 320 }}>{children}</div>
  </div>
);
const Title = ({ children }: { children: React.ReactNode }) => (
  <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>{children}</h1>
);
const Body = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 14.5, lineHeight: 1.55, color: "rgba(250,250,249,.66)", margin: 0 }}>{children}</p>
);
const Mono = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ fontFamily: "ui-monospace, monospace", letterSpacing: ".08em" }}>{children}</strong>
);
const retryBtn: React.CSSProperties = {
  marginTop: 18, padding: "13px 26px", borderRadius: 11, border: 0,
  background: "#fafaf9", color: "#1c1917", fontSize: 14.5, fontWeight: 700,
};
const offlineBar: React.CSSProperties = {
  position: "fixed", top: 0, left: 0, right: 0, zIndex: 70,
  background: "#78350f", color: "#fef3c7", fontSize: 12,
  padding: "7px 14px", textAlign: "center", fontFamily: "system-ui, sans-serif",
};
