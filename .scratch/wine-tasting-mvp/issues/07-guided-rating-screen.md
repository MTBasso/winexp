# The guided rating screen: Axes, scale, and Descriptors, in pt-BR

Type: prototype
Status: resolved
Blocked by: 04

## Question

This is the most interesting idea in the brief and the least specified: a person
with no wine vocabulary must be told what they are rating, and come away feeling
they said something true.

Build a prototype of the rating screen for one Pour, settling:

- Which Axes — how many, and phrased how, in Brazilian Portuguese, for someone
  who cannot tell Malbec from Merlot. Avoid the wine-school register entirely.
- The response scale: how many points, whether the endpoints are labelled in
  words rather than numbers, and whether Axes roll up into one overall score.
- The Descriptor set: which words, how they are grouped, how many a Taster may
  tap, and whether they differ by wine colour or style.
- The Note: three lines enforced how — a character cap, a line cap, or a soft
  nudge — and what the placeholder says.
- What an Impression looks like once recorded, given it stays freely editable.

The Descriptors carry disproportionate weight: they are what makes a Carousel
look considered with almost no typing. Link the prototype from this ticket.

## Notes from ticket 02

[ADR-0004](../../../docs/adr/0004-slides-are-pre-rendered.md) makes editing an
Impression cheap for the Taster but not free for the app: any edit invalidates
the pre-rendered Carousel and forces a re-render before sharing is possible
again. Since Impressions stay freely editable for the whole Tasting, this screen
should not encourage churn it does not need to — and the Note must be clamped by
grapheme, not code unit, so emoji and accented pt-BR characters count as one.

## Prototype — 2026-09-06

Three rating screens at `/prototype/taster?variant=A|B|C`, each opening inside
the settled deck (ticket 04) so they are judged in context rather than in a
vacuum. Tap *Avaliar este vinho* on any Pour card.

**The four Axes proposed**, in pt-BR with no wine-school register — no
*taninos*, no *acidez*, no *final de boca*:

1. *O quanto você gostou?* — Nem um pouco ↔ Muito
2. *Como ele parece na boca?* — Leve, fácil ↔ Encorpado, forte
3. *Puxa mais para onde?* — Seco ↔ Doce
4. *Pediria outra taça?* — Não ↔ Com certeza

Plus twelve tappable Descriptors capped at three, and a Note clamped at 140
graphemes via `Intl.Segmenter` (ticket 02: clamp by grapheme, so emoji and
accented characters count as one).

The three structures:

- **A — Deslizadores.** All four Axes at once as 1–5 sliders with worded ends,
  then Descriptors, then the Note. One screen, one scroll, fastest to review
  and edit.
- **B — Ou / ou.** Each Axis collapses to a two-way tap: *Leve, fácil* or
  *Encorpado, forte*. No middle, no ambiguity, four taps to a complete
  Impression. Loses nuance by design — the question is whether anyone misses it.
- **C — Uma pergunta por vez.** Full-screen wizard, one Axis per step with big
  1–5 targets that auto-advance, then a Descriptors step, then the Note. Most
  guided, most taps, hardest to go back and edit.

Open question the prototype cannot settle by itself: whether four Axes is one
too many for someone on their fifth glass, and whether *Puxa mais para onde?*
reads clearly enough without the words *seco* and *doce* being explained.

## Answer

**Variant B — "Ou / ou".** Every Axis is a two-way tap between two plainly
worded options; four taps produce a complete Impression, plus optional
Descriptors and Note.

Why it wins over the alternatives: a slider (A) asks someone to express a
degree they do not actually hold — a person on their fifth glass has an
opinion, not a number — and the wizard (C) buries editing behind a sequence,
which fights the decision that Impressions stay freely editable all evening. B
is the only one where changing your mind about wine 2 after wine 5 costs a
single tap.

The four Axes and the twelve Descriptors are adopted as proposed.

**Known consequence, accepted:** B has no middle. Every answer is one of two
values, so *O quanto você gostou?* cannot express "it was fine" — and that is
the Axis the Carousel leans on hardest. This was flagged before the choice and
chosen anyway; it is a deliberate trade of nuance for speed. Making just that
one Axis a 1–5 scale while the rest stay binary is a small, contained change if
the first real Event shows people reaching for a middle.

Still open, and worth watching at that Event: whether four Axes is one too many,
and whether *Puxa mais para onde?* carries without *seco* and *doce* being
explained.
