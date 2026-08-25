# House style for student-facing prose

Applies to everything a student reads: `lecture.md`, kata intros, quiz scenarios, self-study pages. Not to `lecture-steps.md`, which is mine and has no rules.

The reference implementation is [`01-cloud-services/module-1/03-cost-and-virtualization/lecture.md`](../01-cloud-services/module-1/03-cost-and-virtualization/lecture.md) — short enough to read in one go, and it uses every device below at least once.

## Structure

- **Numbered sections.** `## 1. Topic`, `### 1.1 Sub-topic`. Numbering is how a student in class says "I'm lost at 4.2".
- **An intro blockquote** under the title, before section 1. One short paragraph: what this page covers, what it assumes, and — when the page is dense with jargon — a line saying that new terms get a plain-English version in brackets.
- **A closing `## Sources`** section, numbered list, real and linked.

## The devices

- **Plain-English glosses in italic brackets**, immediately after a term that might be new: `depreciation *[the accounting practice of writing off an asset's cost gradually over its useful life]*`. This is the signature move of these notes. Use it generously. A gloss explains the word to someone who has never met it — it is not a second, more technical definition.
- **Bold for the term being defined.** Backticks for commands, filenames, flags, and exact spec terms (`rapid elasticity`, `docker run`).
- **A blockquote for the one-line takeaway** at the end of a section, when there is a sentence worth remembering: `> The client is a remote control. The daemon is the machine.` At most one per major section, and not every section earns one. A takeaway compresses something the section proved; it is not a summary and never decoration.
- **Tables for genuine comparisons** — VM vs container, what shifts across IaaS/PaaS/SaaS. Not for lists that happen to have two columns.
- **Diagrams by link, not ASCII art.** Official docs images are preferred. Local screenshots go in the lesson's `images/`.
- **Fenced code blocks with a language tag**, and inline `#` comments where a line does something non-obvious. The Dockerfile in `04-intro-to-docker` is the model: every instruction carries a comment saying why it is there, not what it does.

## Register

- **Prose over bullet fragments.** Bullets are for genuinely parallel items. Anything with reasoning behind it gets a sentence.
- **Plain and direct.** Explain the *why* behind a practice rather than asserting it as a rule.
- **No hype, no "simply", no "as we all know", no "it's important to note".** If it's important, just say it.
- **Second person for instructions, first person plural for what happened in class** — "we ran it naively first", "you would hit the same error".
- **British/Norwegian-adjacent spelling** is inconsistent in my drafts. Don't spend effort normalising it unless asked.

## Sources

Every page that makes factual claims ends with `## Sources`: a numbered list of real, linked references — official docs, standards bodies, vendor documentation, named articles.

Two rules that matter more than the formatting:

- **Never invent a URL.** A plausible-looking link to a page that doesn't exist is worse than no link. If you can't verify it, cite the document by name without a link and say so.
- **Cite what the claim actually came from.** If a fact came from class rather than a source, it does not get a citation bolted onto it — see the traceability rule in [artifacts/lecture.md](artifacts/lecture.md).

> **Future:** the citation format will move to **Harvard**, to match the referencing style used elsewhere in the programme. Current pages use a numbered linked list. When that switch happens it happens here, once, and every artifact spec inherits it — don't hard-code a citation format anywhere else.
