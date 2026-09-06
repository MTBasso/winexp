/**
 * PROTOTYPE — throwaway. Ticket 06: the Organizer flow, at
 * /prototype/organizer?variant=A|B|C.
 *
 * Organizers are not technical and may be doing this on a phone at the venue an
 * hour before service. Nothing persists; the passcode is 1234.
 */
import { useCallback, useState } from "react";
import { PrototypeSwitcher } from "../PrototypeSwitcher";
import { Passcode } from "./parts";
import { VariantForm, NAME_FORM } from "./VariantForm";
import { VariantWizard, NAME_WIZARD } from "./VariantWizard";
import { VariantLive, NAME_LIVE } from "./VariantLive";

const VARIANTS = ["A", "B", "C"] as const;
const NAMES = { A: NAME_FORM, B: NAME_WIZARD, C: NAME_LIVE };

export function PrototypeOrganizer() {
  const [unlocked, setUnlocked] = useState(false);
  const [variant, setVariant] = useState(
    () => new URLSearchParams(window.location.search).get("variant") ?? "A",
  );

  const change = useCallback((v: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", v);
    window.history.replaceState(null, "", url);
    setVariant(v);
  }, []);

  if (!unlocked) return <Passcode onUnlock={() => setUnlocked(true)} />;

  return (
    <>
      {variant === "B" ? <VariantWizard /> : variant === "C" ? <VariantLive /> : <VariantForm />}
      <PrototypeSwitcher variants={VARIANTS} current={variant} onChange={change} names={NAMES} />
    </>
  );
}
