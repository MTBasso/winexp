# Wine Tasting

A roving wine group runs tasting events at borrowed venues. Tasters at those
events record their impressions of each wine as it is poured, and leave with a
shareable carousel of those impressions.

## Language

### The event

**Event**:
A single tasting, on one date, at one venue, with its own lineup.
_Avoid_: degustation, dinner, session, tasting

**Venue**:
The place hosting an Event. The group owns no venue; a Venue is recorded on the
Event and nowhere else.
_Avoid_: restaurant, location, place

**Organizer**:
A member of the group who creates Events and maintains their lineups.
_Avoid_: admin, host, owner

**Lineup**:
The ordered set of Pours served at one Event.
_Avoid_: menu, list, flight, selection

**Pour**:
One wine's place in one Event's Lineup — the thing a Taster forms an Impression
of. Two Events serving the same wine have two distinct Pours.
_Avoid_: bottle, glass, item, entry

**Wine**:
The product itself: producer, name, vintage, grape, country. A Pour describes
the Wine it serves; a Wine is not tracked apart from the Pours that serve it.
_Avoid_: label, product, bottle

### The taster

**Taster**:
A person attending an Event who rates what they drink. Never registers an
account and is never identified beyond a first name they volunteer.
_Avoid_: customer, user, guest, reviewer, attendee

**Tasting**:
One Taster's pass through one Event's Lineup, and everything they record during
it.
_Avoid_: session, visit, journey

**Impression**:
One Taster's complete response to one Pour — its Ratings, its Descriptors and
its Note together.
_Avoid_: review, feedback, response

**Rating**:
A Taster's answer on one Axis for one Pour.
_Avoid_: score, stars, mark

**Axis**:
A plain-language dimension a Pour is rated on, phrased for someone with no wine
vocabulary.
_Avoid_: dimension, criterion, metric, attribute, question

**Descriptor**:
A pre-written tasting word a Taster can tap to attach to an Impression, rather
than having to think of it themselves.
_Avoid_: tag, chip, flavour note, keyword

**Note**:
The Taster's own words about a Pour, at most three lines.
_Avoid_: comment, review, text, caption

### The share

**Carousel**:
The set of images generated from one Tasting for the Taster to post to social
media.
_Avoid_: post, story, deck, gallery

**Slide**:
One image within a Carousel.
_Avoid_: card, page, frame, image
