/**
 * PROTOTYPE — throwaway.
 *
 * The deck (ticket 04) and the "ou / ou" rating screen (ticket 07) are both
 * settled, so there is nothing left to switch here. State is in memory only —
 * the Tasting's real shape is ticket 10.
 */
import { useEffect, useState } from "react";
import { Deck } from "./Deck";
import { STUB_EVENT } from "./stubData";
import { EMPTY_IMPRESSION, isStarted, type Impression } from "./rating/content";

type Impressions = Readonly<Record<string, Impression>>;

export function PrototypeTaster() {
  const [impressions, setImpressions] = useState<Impressions>({});
  const [firstName, setFirstName] = useState<string | null>(null);
  const [nameAsked, setNameAsked] = useState(false);
  const [key, setKey] = useState(0);

  const done = Object.values(impressions).filter(isStarted).length;

  // ADR-0004: the Carousel pre-renders, so sharing is briefly unavailable.
  const [shareReady, setShareReady] = useState(true);
  useEffect(() => {
    if (done === 0) return;
    setShareReady(false);
    const t = setTimeout(() => setShareReady(true), 1400);
    return () => clearTimeout(t);
  }, [done]);

  const reset = () => {
    setImpressions({});
    setFirstName(null);
    setNameAsked(false);
    setKey((k) => k + 1);
  };

  /** Fakes coming back mid-Tasting: the deck should open on wine 4, not card 0. */
  const simulateReturn = () => {
    const seeded: Record<string, Impression> = {};
    STUB_EVENT.lineup.slice(0, 3).forEach((p) => {
      seeded[p.id] = { ...EMPTY_IMPRESSION, ratings: { gostei: 4 }, descriptors: ["frutas vermelhas"] };
    });
    setImpressions(seeded);
    setFirstName("Ana");
    setNameAsked(true);
    setKey((k) => k + 1);
  };

  return (
    <>
      <Deck
        key={key}
        impressions={impressions}
        setImpressions={setImpressions}
        firstName={firstName}
        setFirstName={setFirstName}
        nameAsked={nameAsked}
        setNameAsked={setNameAsked}
        shareReady={shareReady}
      />
      <div style={devBar}>
        <button style={devBtn} onClick={reset}>zerar</button>
        <button style={devBtn} onClick={simulateReturn}>simular retorno</button>
      </div>
    </>
  );
}

const devBar: React.CSSProperties = { position: "fixed", top: 8, right: 8, display: "flex", gap: 6, zIndex: 9999 };
const devBtn: React.CSSProperties = {
  background: "rgba(250,250,249,.14)", color: "#fafaf9", border: 0,
  borderRadius: 999, padding: "5px 11px", fontSize: 11, fontFamily: "ui-monospace, monospace",
};
