# The Organizer flow: create an Event, build a Lineup, print the QR

Type: prototype
Status: claimed
Blocked by: 05

## Question

Organizers are not technical and will be doing this on a phone, possibly at the
venue an hour before service.

Build a rough prototype covering:

- Entering the admin behind the shared passcode, and how long that lasts.
- Creating an Event: what is required versus optional, given the lifecycle
  decided in ticket 05.
- Building a Lineup: adding Pours with their wine details typed fresh, the
  fields that matter, reordering, and removing.
- Generating and printing the per-Event QR — what the printable sheet is for and
  where it physically goes on the table.
- Seeing past Events, if that is worth having at all.

Link the prototype from this ticket.

## Prototype — 2026-09-06

Three Organizer flows at `/prototype/organizer?variant=A|B|C`, behind the shared
passcode (`1234` in the prototype). Each covers the same ground — create the
Event, build the Lineup, generate the printable QR, see past Events — and
disagrees about how.

- **A — Formulário.** One scrolling page. Event name and date at the top, then a
  card per Pour with all five fields, reorder arrows and a remove button, then
  past Events, with *Gerar QR* pinned at the bottom. Everything visible, nothing
  hidden; longest page.
- **B — Assistente.** Three steps: Evento → Vinhos → QR. Wines are added one at
  a time into a running list, and the last step *is* the printable sheet. Most
  guided, and the only one that cannot be finished out of order.
- **C — Lista viva.** No form at all: the Event name and date are edited in
  place in the header, the Lineup is the page, and tapping a row expands it for
  editing. The QR sits in the header from the first second, so it is printable
  before the Lineup exists.

The printable sheet is shared by all three: Event name, date, the QR, *"Aponte a
câmera para avaliar os vinhos"*, and one line about leaving with your
impressions. The QR pattern is a deterministic stand-in — this ticket is about
what the sheet says, not the encoder.

Fields per Pour in all three: **nome do vinho, produtor, safra, país, uva** —
denormalised onto the Pour, no catalogue.

What the variants really put to you:

- **Does the QR exist before the Lineup does?** C says yes and treats the Event
  as live from creation, which matches ticket 05's no-states decision most
  honestly. A and B gate it behind *Gerar QR*, which implies a publish step that
  ticket 05 says does not exist.
- **How much does an Organizer type at the venue?** B's one-at-a-time entry is
  calmest on a phone; A is fastest for someone who already has the list.
- Whether reordering matters. Only A has explicit reorder arrows; B and C rely
  on entry order.
