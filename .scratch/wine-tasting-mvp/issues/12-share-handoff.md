# The share hand-off: from rendered Slides to a posted Carousel

Type: prototype
Status: open
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
