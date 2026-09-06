/**
 * PROTOTYPE — throwaway. The Organizer admin settled by ticket 06.
 *
 * Organizers are not technical and may be doing this on a phone at the venue an
 * hour before service. Nothing persists; the passcode is 1234, and how long a
 * session lasts is ticket 09.
 *
 * The rejected flows (Formulário, Assistente) live on the
 * prototype/rejected-organizer branch.
 */
import { useState } from "react";
import { Passcode } from "./parts";
import { OrganizerAdmin } from "./OrganizerAdmin";

export function PrototypeOrganizer() {
  const [unlocked, setUnlocked] = useState(false);
  if (!unlocked) return <Passcode onUnlock={() => setUnlocked(true)} />;
  return <OrganizerAdmin />;
}
