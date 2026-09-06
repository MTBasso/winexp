/** PROTOTYPE — throwaway. In-memory Organizer state for ticket 06. */

export interface DraftPour {
  readonly id: string;
  producer: string;
  name: string;
  vintage: string;
  grape: string;
  country: string;
}

export interface DraftEvent {
  readonly id: string;
  readonly code: string;
  name: string;
  date: string;
  pours: DraftPour[];
}

let seq = 0;
export const newId = () => `tmp${(seq += 1)}`;

/** Stand-in for the Event code in the QR URL — ticket 10 decides the real one. */
export const makeCode = () =>
  Math.random().toString(36).slice(2, 7).toUpperCase();

export const emptyPour = (): DraftPour => ({
  id: newId(), producer: "", name: "", vintage: "", grape: "", country: "",
});

export const newEvent = (): DraftEvent => ({
  id: newId(), code: makeCode(), name: "", date: "", pours: [],
});

export const PAST_EVENTS = [
  { id: "e9", code: "K3M2Q", name: "Toscana, sítio do Paulo", date: "2 de agosto", pourCount: 6 },
  { id: "e8", code: "R7X1B", name: "Espumantes, apto da Bia", date: "12 de julho", pourCount: 5 },
];

export const isPourUsable = (p: DraftPour) =>
  p.name.trim().length > 0 || p.producer.trim().length > 0;

export const isEventUsable = (e: DraftEvent) =>
  e.name.trim().length > 0 && e.date.trim().length > 0 && e.pours.some(isPourUsable);
