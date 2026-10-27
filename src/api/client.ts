/**
 * Client for the Event API.
 *
 * The passcode is held in localStorage and sent as a bearer header on every
 * mutating call (ticket 09). An Organizer types it once per device and is never
 * asked again — the protection is against someone wiping a Lineup mid-Event,
 * not against reading anything, so it should cost them nothing after the first
 * time.
 */
import type { Event, Pour } from "../domain/types";

const PASSCODE_KEY = "organizer-passcode";

export const getPasscode = (): string | null => {
  try {
    return localStorage.getItem(PASSCODE_KEY);
  } catch {
    return null;
  }
};

export const setPasscode = (value: string): void => {
  try {
    localStorage.setItem(PASSCODE_KEY, value);
  } catch {
    /* private mode — the Organizer re-enters it next visit */
  }
};

export const clearPasscode = (): void => {
  try {
    localStorage.removeItem(PASSCODE_KEY);
  } catch {
    /* nothing to do */
  }
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const passcode = getPasscode();
  const headers = new Headers(init.headers);
  // Only default to JSON when the caller hasn't already set its own
  // Content-Type (e.g. the raw image upload below, which sends the file's
  // real MIME type).
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (passcode) headers.set("Authorization", `Bearer ${passcode}`);

  let response: Response;
  try {
    response = await fetch(path, { ...init, headers });
  } catch {
    // Offline, or venue wifi died mid-save.
    throw new ApiError("Sem conexão", 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new ApiError(body?.error ?? "Algo deu errado", response.status);
  }
  return (await response.json()) as T;
}

export type PourInput = Omit<Pour, "imageUrl">;

export interface EventSummary {
  id: string;
  code: string;
  name: string;
  date: string;
  pour_count: number;
}

/** Public — the only call a Taster makes. */
export const fetchEvent = (code: string) =>
  call<Event>(`/api/events/${encodeURIComponent(code)}`);

export const listEvents = () =>
  call<{ events: EventSummary[] }>("/api/events");

export const createEvent = (name: string, date: string) =>
  call<Event>("/api/events", { method: "POST", body: JSON.stringify({ name, date }) });

export const patchEvent = (id: string, name: string, date: string) =>
  call<{ ok: true }>(`/api/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, date }),
  });

/** The Lineup is replaced wholesale (ticket 10). */
export const putLineup = (id: string, pours: readonly PourInput[]) =>
  call<{ ok: true; count: number }>(`/api/events/${id}/pours`, {
    method: "PUT",
    body: JSON.stringify({ pours }),
  });

/** Bottle photo upload (ticket: bottle images) — immediate, not autosaved. */
export const uploadPourImage = (eventCode: string, pourId: string, file: File) =>
  call<{ ok: true; imageKey: string }>(
    `/api/events/${encodeURIComponent(eventCode)}/pours/${pourId}/image`,
    { method: "PUT", headers: { "Content-Type": file.type }, body: file },
  );

/** Does the stored passcode still work? Cheapest authenticated call. */
export const checkPasscode = async (): Promise<boolean> => {
  try {
    await listEvents();
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false;
    // A network failure is not a wrong passcode — do not lock them out for it.
    return true;
  }
};
