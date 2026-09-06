/** PROTOTYPE — throwaway. Stub Event for ticket 04. Not production data. */

export interface StubPour {
  readonly id: string;
  readonly position: number;
  readonly producer: string;
  readonly name: string;
  readonly vintage: number;
  readonly grape: string;
  readonly country: string;
}

export interface StubEvent {
  readonly name: string;
  readonly date: string;
  readonly lineup: readonly StubPour[];
}

// Ticket 05: an Event requires both a name and a date, and the date is shown so
// nobody rates into the wrong dinner.
export const STUB_EVENT: StubEvent = {
  name: "Douro, casa da Ana",
  date: "6 de setembro",
  lineup: [
    { id: "p1", position: 1, producer: "Cave Geisse", name: "Brut Nature", vintage: 2019, grape: "Chardonnay e Pinot Noir", country: "Brasil" },
    { id: "p2", position: 2, producer: "Aveleda", name: "Vinho Verde Loureiro", vintage: 2023, grape: "Loureiro", country: "Portugal" },
    { id: "p3", position: 3, producer: "Miolo", name: "Reserva Chardonnay", vintage: 2022, grape: "Chardonnay", country: "Brasil" },
    { id: "p4", position: 4, producer: "Quinta do Crasto", name: "Douro Tinto", vintage: 2020, grape: "Touriga Nacional", country: "Portugal" },
    { id: "p5", position: 5, producer: "Catena", name: "Malbec Alta", vintage: 2019, grape: "Malbec", country: "Argentina" },
    { id: "p6", position: 6, producer: "Lidio Carraro", name: "Grande Vindima", vintage: 2018, grape: "Merlot", country: "Brasil" },
    { id: "p7", position: 7, producer: "Niepoort", name: "Tawny 10 anos", vintage: 2014, grape: "Blend do Douro", country: "Portugal" },
  ],
};

/** In-memory only — prototypes do not persist. */
export type Impressions = Readonly<Record<string, boolean>>;

export interface TasterState {
  readonly impressions: Impressions;
  readonly firstName: string | null;
}

export const ratedCount = (i: Impressions) => Object.values(i).filter(Boolean).length;
