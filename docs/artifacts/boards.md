# `boards/` and `images/`

## Purpose

`boards/` holds photographs of the physical whiteboard from class — what was actually drawn, in the order it was drawn. They serve two audiences: students who want the thing they saw in the room, and Nicholas, as a memory aid when writing up the lesson.

`images/` is different: diagrams and screenshots referenced directly by `lecture.md`, including images saved from official documentation.

## When they exist

`boards/` in any lesson taught at a whiteboard — which is most of the conceptual ones. `images/` only when the lecture needs a picture that isn't a board photo.

## Naming

```
boards/01-capex-opex.jpeg
boards/02-capex-considerations.jpeg
boards/05-containers-vs-vm.jpeg
```

Two-digit prefix in **drawing order**, then a slug describing what is on the board. Extensions are whatever the phone produced — `.jpg` and `.jpeg` both appear and that is fine.

## Rules

- **Don't rename or re-encode them without asking.** They are straight off the phone. Normalising the extensions or recompressing is a large, unreviewable diff for no gain.
- **The prose supersedes the board.** Most boards say something `lecture.md` says better in words. Those stay in the folder as an archive and are not linked.
- **Link a board only when it says something prose cannot** — a spatial relationship, a diagram that took five minutes to draw, a table built up in stages.
- **Diagrams by link, not ASCII art.** When a lecture needs a diagram and no board covers it, prefer an official docs image over drawing one in text. Save it into `images/` if it needs to be local.
- **The board is not a source.** It records what was said in class. If a claim needs a citation it gets a real one in `## Sources`.

## Failure modes

| Failure | What it looks like |
|---|---|
| **Embedding all of them** | Every board photo linked into the lecture in sequence, turning a written resource into a photo album with captions. |
| **Reading detail off a photo** | Asserting a specific number or label from a blurry whiteboard image as though it were verified. If the board is the only source for a fact, flag it. |
| **ASCII substitution** | Redrawing a board as an ASCII diagram in the lecture. Explicitly against house style. |
| **Renumbering** | "Fixing" a gap in the number sequence. The numbers are drawing order; a gap means a photo was discarded. |

## Exemplars

- [`01-intro-to-cloud/boards/`](../../01-cloud-services/module-1/01-intro-to-cloud/boards/) — seven boards building the NIST characteristics up one at a time, ending in a summary board.
- [`01-docker-networking-and-compose/images/docker-networks.png`](../../01-cloud-services/module-2/01-docker-networking-and-compose/images/docker-networks.png) — the `images/` case: a diagram the lecture actually needs inline.
