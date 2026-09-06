/**
 * Debounced autosave with an honest status.
 *
 * An Organizer at a venue an hour before service needs to know their list is
 * safe, so "saved" and "failed" are both visible states rather than a silent
 * assumption. Failures keep the pending change and retry on the next edit.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: number }
  | { status: "failed"; message: string };

export function useAutosave<T>(
  save: (value: T) => Promise<unknown>,
  delayMs = 800,
): { state: SaveState; schedule: (value: T) => void; flush: () => void } {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<T | null>(null);
  const saveRef = useRef(save);
  saveRef.current = save;

  const run = useCallback(async () => {
    if (pending.current === null) return;
    const value = pending.current;
    pending.current = null;
    setState({ status: "saving" });
    try {
      await saveRef.current(value);
      setState({ status: "saved", at: Date.now() });
    } catch (error) {
      // Keep the value so the next edit retries it rather than losing it.
      pending.current = value;
      setState({
        status: "failed",
        message: error instanceof Error ? error.message : "Falha ao salvar",
      });
    }
  }, []);

  const schedule = useCallback(
    (value: T) => {
      pending.current = value;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(run, delayMs);
    },
    [run, delayMs],
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    void run();
  }, [run]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { state, schedule, flush };
}
