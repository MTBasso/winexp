# The share hand-off: from rendered Slides to a posted Carousel

Type: prototype
Status: resolved
Blocked by: 08, 13

## Question

Ticket 01 moved the ending of the flow: the product hands the Taster a set of
saved images plus instructions, rather than delivering them into Instagram. That
final screen is now a designed artefact, not a button, and it is the last thing
a Taster sees.

Prototype it, settling:

- What the Taster sees while the Carousel renders, given ADR-0004 pre-renders it
  — a progress state, a quiet disabled control, or something that hides the wait
  behind the rest of the flow.
- The share control's own copy in pt-BR. "Compartilhar" over-promises if what
  actually happens is a save; "Salvar imagens" is honest but sounds less
  exciting. Decide the register.
- The instructions after the save: how to post a Carousel from the Instagram
  app, short enough that someone several glasses in will follow them.
- The fallback when `navigator.share` is unavailable or throws — including
  Android WebView in-app browsers, which have no Web Share at all. Note that
  `canShare()` cannot be used as the gate (ticket 01); detect and catch instead.
- What happens on a failed or cancelled share: per ADR-0004 the activation is
  spent, so recovery needs a fresh tap and the UI must invite one.
- Whether anything encourages the Taster to tag the group, and how that survives
  the fact that we never see the post.

## Answer

Folded into ticket 19 rather than prototyped separately — by the time it came
up the deck was real, so the hand-off could be built in place instead of mocked.

- **While rendering:** the control is disabled and counts *"Preparando suas
  imagens… 3/8"*, so the ADR-0004 wait is visible rather than mysterious.
- **The control says "Salvar N imagens", not "Compartilhar".** ADR-0003: this is
  a save. Promising Instagram would be a promise we cannot keep.
- **After a successful share** a short pt-BR instruction appears — open
  Instagram, tap +, pick the N images in order, publish.
- **No Web Share** (Android WebView, in-app browsers): the numbered per-Slide
  download links are shown instead, with copy explaining why.
- **A failed share** shows the download links alongside an invitation to tap
  again — the activation is spent, so recovery needs a fresh gesture and an
  automatic retry would always fail.
- **Dismissing the sheet is not an error.** `AbortError` is swallowed silently.
