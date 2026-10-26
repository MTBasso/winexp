/**
 * The rating screen settled by ticket 07: "ou / ou", plus the Aroma Wheel and
 * the 5-point "O que achei" scale.
 *
 * Each Axis is a two-way tap. There is deliberately no middle value — the
 * accepted trade recorded on ticket 07.
 */
import { useState } from "react";
import type { AcheiValue, Impression, Pour } from "../domain/types";
import { clampGraphemes, countGraphemes, NOTE_MAX_GRAPHEMES } from "../domain/text";
import { ACHEI_SCALE, AXES, MAX_DESCRIPTORS } from "./content";
import { dimmedCategoryIds, visibleCategoriesForTipo } from "./aromaWheel";

export interface RatingChange {
  ratings?: Impression["ratings"];
  descriptors?: string[];
  note?: string;
  achei?: AcheiValue;
}

export function RatingSheet({
  pour, impression, onChange, onDone, onClose,
}: {
  pour: Pour;
  impression: Impression | undefined;
  onChange: (change: RatingChange) => void;
  onDone: () => void;
  onClose: () => void;
}) {
  const ratings = impression?.ratings ?? {};
  const descriptors = impression?.descriptors ?? [];
  const note = impression?.note ?? "";
  const achei = impression?.achei ?? null;
  const used = countGraphemes(note);
  const full = descriptors.length >= MAX_DESCRIPTORS;

  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (d: string) =>
    onChange({
      descriptors: descriptors.includes(d)
        ? descriptors.filter((x) => x !== d)
        : [...descriptors, d],
    });

  const categories = visibleCategoriesForTipo(pour.tipo);
  const dimmed = dimmedCategoryIds(descriptors);

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 12, color: "rgba(250,250,249,.5)" }}>Vinho {pour.position}</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>{pour.name}</div>

        <div style={{ display: "grid", gap: 22 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>O que achou?</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ACHEI_SCALE.map((opt) => {
                const on = achei === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => onChange({ achei: opt.value })}
                    style={{
                      flex: "1 1 30%", minWidth: 100, padding: "14px 8px", borderRadius: 12,
                      fontSize: 13.5, fontWeight: 600, color: "#fafaf9",
                      border: `1px solid ${on ? "#7f1d1d" : "rgba(250,250,249,.22)"}`,
                      background: on ? "#7f1d1d" : "transparent",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {AXES.map((axis) => (
            <div key={axis.id}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>{axis.question}</div>
              <div style={{ display: "flex", gap: 8 }}>
                {(["low", "high"] as const).map((side) => {
                  const on = ratings[axis.id] === side;
                  return (
                    <button
                      key={side}
                      onClick={() => onChange({ ratings: { ...ratings, [axis.id]: side } })}
                      style={{
                        flex: 1, padding: "16px 10px", borderRadius: 12,
                        fontSize: 14.5, fontWeight: 600, color: "#fafaf9",
                        border: `1px solid ${on ? "#7f1d1d" : "rgba(250,250,249,.22)"}`,
                        background: on ? "#7f1d1d" : "transparent",
                      }}
                    >
                      {side === "low" ? axis.low : axis.high}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <div style={{ fontSize: 13, color: "rgba(250,250,249,.6)", marginBottom: 10 }}>
              Lembra de algum aroma? Toque numa categoria e depois no termo. Até {MAX_DESCRIPTORS}.
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {categories.map((category) => {
                const open = expanded === category.id;
                const hasSelected = category.terms.some((t) => descriptors.includes(t));
                const dim = dimmed.has(category.id) && !hasSelected;
                return (
                  <button
                    key={category.id}
                    onClick={() => setExpanded(open ? null : category.id)}
                    style={{
                      padding: "8px 13px", borderRadius: 999, fontSize: 13,
                      border: `1px solid ${open || hasSelected ? "#7f1d1d" : "rgba(250,250,249,.22)"}`,
                      background: open || hasSelected ? "#7f1d1d" : "transparent",
                      color: open || hasSelected ? "#fff" : dim ? "rgba(250,250,249,.3)" : "#fafaf9",
                    }}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            {expanded && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                {categories.find((c) => c.id === expanded)?.terms.map((term) => {
                  const on = descriptors.includes(term);
                  const disabled = full && !on;
                  return (
                    <button
                      key={term}
                      onClick={() => toggle(term)}
                      disabled={disabled}
                      style={{
                        padding: "8px 13px", borderRadius: 999, fontSize: 13,
                        border: `1px solid ${on ? "#7f1d1d" : "rgba(250,250,249,.22)"}`,
                        background: on ? "#7f1d1d" : "transparent",
                        color: on ? "#fff" : disabled ? "rgba(250,250,249,.25)" : "#fafaf9",
                      }}
                    >
                      {term}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <textarea
              value={note}
              onChange={(e) => onChange({ note: clampGraphemes(e.target.value) })}
              rows={3}
              placeholder="Em poucas palavras, o que achou?"
              style={{
                width: "100%", padding: "12px 13px", borderRadius: 11, fontSize: 15,
                lineHeight: 1.45, resize: "none", fontFamily: "inherit",
                border: "1px solid rgba(250,250,249,.22)",
                background: "rgba(250,250,249,.06)", color: "#fafaf9",
              }}
            />
            <div style={{ fontSize: 11.5, textAlign: "right", marginTop: 4, color: "rgba(250,250,249,.45)" }}>
              {used}/{NOTE_MAX_GRAPHEMES}
            </div>
          </div>

          <button onClick={onDone} style={doneBtn}>Pronto</button>
        </div>
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(12,10,9,.6)",
  display: "flex", alignItems: "flex-end", zIndex: 60,
};
const sheet: React.CSSProperties = {
  background: "#1c1917", width: "100%", maxHeight: "92vh", overflowY: "auto",
  borderRadius: "18px 18px 0 0", padding: "20px 20px 30px",
  border: "1px solid rgba(250,250,249,.12)",
};
const doneBtn: React.CSSProperties = {
  width: "100%", padding: 15, borderRadius: 12, border: 0,
  background: "#7f1d1d", color: "#fff", fontSize: 15, fontWeight: 700,
};
