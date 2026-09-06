# The Taster flow, scan to share

Type: prototype
Status: resolved
Blocked by: —

## Question

What does the Taster actually move through, from scanning the QR to handing
Slides to the share sheet?

Build a rough, clickable prototype good enough to react to on a phone, covering:

- The landing moment after the scan — what a Taster sees first, and how the
  Event and its Lineup are introduced to someone who has had a glass of wine and
  will read almost nothing.
- The Lineup screen: how Pours are listed, how "rated" versus "not yet rated" is
  shown, and how a Taster gets back to it repeatedly over two hours.
- Where the first-name prompt sits, given it is optional and only exists to
  personalise the Carousel.
- Where the share entry point lives and when it becomes available — now
  constrained by [ADR-0004](../../../docs/adr/0004-slides-are-pre-rendered.md):
  the Carousel is pre-rendered, so the control has a genuine *not ready yet*
  state that the Taster can encounter. Decide what that looks like and whether
  rendering starts eagerly after the first Impression or only on demand.
- How re-entry works: same URL, phone locked and reopened an hour later, with
  progress intact.

The rating screen itself is a separate ticket — stub it here. Link the prototype
from this ticket rather than pasting it in.

## Prototype — 2026-09-06

Three structurally different takes on the whole flow, on the throwaway route
`/prototype/taster`, switchable with `?variant=A|B|C` (or the arrow keys / the
bar at the bottom). Copy is pt-BR so it can be judged honestly. The rating
screen is deliberately stubbed — that is ticket 07.

- **A — Lista, tudo à vista.** The whole Lineup as a vertical list on a cream
  ground, with a progress bar in the header and a persistent share button
  pinned at the bottom. Everything is visible at once; nothing is hidden behind
  navigation. Name prompt appears inline after the first Impression.
- **B — Baralho, um vinho por vez.** A dark, full-screen deck: one Pour per
  card, story-style progress pips, previous/next at the bottom, and a closing
  card that carries the name prompt and the share button. Almost nothing to
  read per screen.
- **C — Agora, o vinho na sua taça.** Opens on the next unrated Pour as a single
  large card — the wine actually being served — with the rest of the Lineup
  collapsed behind a "ver todos" strip, and share living as a chip in the
  header. Optimised for rate-as-served rather than for browsing.

Each answers the ticket's questions differently on purpose: where the share
entry point lives, where the first-name prompt sits, and how prominent the
Lineup is. `simular retorno (3 avaliados)` in the corner fakes coming back
mid-Tasting; `zerar` resets.

All three implement ADR-0004's *not ready yet* share state (faked at ~1.4s after
each new Impression) so the pre-render wait can be judged rather than imagined.

**Files:** `src/prototypes/taster/` and `src/prototypes/PrototypeSwitcher.tsx`.
Throwaway — the winner gets rewritten properly, the losers go to a branch.

## Answer

**B's deck, C's live-rating focus, and the name asked before the first bottle.**

The settled flow:

- **A dark, full-screen deck**, one Pour per card, story-style progress pips,
  previous/next navigation. Almost nothing to read per screen — the right call
  for someone holding a glass in a dim room. Variant A's list was rejected as
  too much to scan; the Lineup is not something a Taster browses, it is
  something they move through.
- **Card 0 asks the first name**, before the first bottle, optional and
  skippable. Asking up front means the Carousel is personalised from the first
  Slide, and it removes the awkward late interruption that variants A and B
  originally had. A Taster who skips is never asked again.
- **The deck opens on the Pour being served now** — C's idea, kept. On first
  entry that is card 0 then wine 1; on re-entry it jumps to the first unrated
  Pour rather than back to the start, and that card is marked *sendo servido
  agora*. Rate-as-served without forcing order: previous/next still reach every
  Pour, and any Impression stays editable.
- **A closing card carries the share control**, with ADR-0004's *preparando suas
  imagens…* state visible while the Carousel pre-renders.

Rejected: variant A's persistent bottom share bar (it competes with the rating
action all evening) and variant C's header share chip (too easy to miss at the
one moment it matters).

The merged deck is now the fixed shell in the prototype, and `?variant=` was
repointed at ticket 07's rating-screen options so they can be judged inside the
real flow.
