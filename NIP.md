# NIP-PressStr: Magazines, Magazine Issues & Ebooks

This document defines three new addressable event kinds for sharing digital publications—magazines (with recurring issues) and ebooks—on Nostr.

---

## Motivation

There is no standard way to publish or discover digital periodicals (magazines, journals, newsletters) or ebooks on Nostr. This NIP defines a minimal, relay-friendly schema that:

- Groups magazine issues under a single addressable magazine identity.
- Lets readers follow a magazine by its `pubkey + kind + d` coordinate.
- Supports arbitrary issue identifiers (e.g. `2024-01`, `Vol.3 No.12`, `Spring Edition`).
- Works for ebooks distributed as PDF or EPUB files.
- Is compatible with Blossom file hosting.

---

## Kind Definitions

### Kind 34609 — Magazine (Publication)

An addressable event that represents a **magazine or periodical publication**. It is the parent record that groups individual issues together. Publishers create one Magazine event per title.

#### Tags

| Tag | Req | Description |
|-----|-----|-------------|
| `d` | **required** | Unique slug identifier for this magazine (e.g. `bitcoin-magazine`, `nostr-weekly`) |
| `title` | **required** | Human-readable name of the magazine |
| `image` | optional | URL of the magazine logo / masthead image |
| `summary` | optional | Short description of the magazine |
| `t` | optional (multiple) | Category/topic tags (e.g. `bitcoin`, `tech`, `art`) |
| `l` | optional | Language code (e.g. `en`, `de`) |
| `url` | optional | External website URL for the magazine |
| `alt` | **required** | Human-readable fallback: `"Magazine: <title>"` |

#### Content

Empty string or an extended description / about text in Markdown.

#### Example

```json
{
  "kind": 34609,
  "content": "The world's leading Bitcoin magazine, covering protocol, culture, and economy.",
  "tags": [
    ["d", "bitcoin-magazine"],
    ["title", "Bitcoin Magazine"],
    ["image", "https://blossom.example.com/logo.webp"],
    ["summary", "Bitcoin protocol, culture, and economy."],
    ["t", "bitcoin"],
    ["t", "finance"],
    ["l", "en"],
    ["url", "https://bitcoinmagazine.com"],
    ["alt", "Magazine: Bitcoin Magazine"]
  ]
}
```

---

### Kind 39731 — Magazine Issue

An addressable event representing a **single issue** of a magazine. Each issue references its parent magazine via an `a` tag.

#### Tags

| Tag | Req | Description |
|-----|-----|-------------|
| `d` | **required** | Unique slug for this issue within the magazine (e.g. `2024-01`, `vol3-no12`, `spring-2025`) |
| `title` | **required** | Display title of this issue (e.g. `"Vol. 3 No. 12 — Spring 2025"`) |
| `issue` | **required** | The issue identifier/number as a free-form string (e.g. `12`, `Spring 2025`, `2024-Q1`) |
| `a` | **required** | Reference to parent Magazine: `"34609:<pubkey>:<magazine-d-tag>"` |
| `image` | **required** | URL of the cover image for this issue |
| `url` | **required** | URL of the PDF file hosted on Blossom or another server |
| `m` | optional | MIME type of the file (default: `application/pdf`) |
| `size` | optional | File size in bytes |
| `x` | optional | SHA-256 hash of the file (hex) |
| `summary` | optional | Short description / editorial note for this issue |
| `published_at` | optional | Unix timestamp of the original publication date |
| `t` | optional (multiple) | Topic tags inherited or specific to this issue |
| `alt` | **required** | Human-readable fallback: `"Magazine Issue: <title>, Issue <issue>"` |

#### Content

Empty string or editorial notes / table of contents in Markdown.

#### Example

```json
{
  "kind": 39731,
  "content": "This month: The Lightning Network turns 5, plus 20 pages on Nostr.",
  "tags": [
    ["d", "2024-05"],
    ["title", "Bitcoin Magazine — May 2024"],
    ["issue", "May 2024"],
    ["a", "34609:ab12cd...:bitcoin-magazine"],
    ["image", "https://blossom.example.com/cover-2024-05.webp"],
    ["url", "https://blossom.example.com/btcmag-2024-05.pdf"],
    ["m", "application/pdf"],
    ["size", "14285714"],
    ["x", "deadbeef..."],
    ["summary", "Lightning Network 5th anniversary special issue."],
    ["published_at", "1714521600"],
    ["t", "bitcoin"],
    ["alt", "Magazine Issue: Bitcoin Magazine — May 2024, Issue May 2024"]
  ]
}
```

---

### Kind 33953 — Ebook

An addressable event representing a standalone **ebook** (PDF or EPUB).

#### Tags

| Tag | Req | Description |
|-----|-----|-------------|
| `d` | **required** | Unique slug identifier (e.g. `the-bitcoin-standard`, `sovereign-individual`) |
| `title` | **required** | Title of the ebook |
| `image` | **required** | URL of the cover image |
| `url` | **required** | URL of the ebook file (PDF or EPUB) hosted on Blossom |
| `m` | **required** | MIME type: `application/pdf` or `application/epub+zip` |
| `author` | optional (multiple) | Author name(s) as plain strings |
| `summary` | optional | Short description / synopsis |
| `published_at` | optional | Unix timestamp of original publication date |
| `size` | optional | File size in bytes |
| `x` | optional | SHA-256 hash of the file (hex) |
| `t` | optional (multiple) | Genre/topic tags (e.g. `fiction`, `economics`, `bitcoin`) |
| `l` | optional | Language code (e.g. `en`, `de`) |
| `isbn` | optional | ISBN-13 as a plain string |
| `alt` | **required** | Human-readable fallback: `"Ebook: <title>"` |

#### Content

Empty string or a full book description / blurb in Markdown.

#### Example

```json
{
  "kind": 33953,
  "content": "A look at the history of money and an argument for Bitcoin as the superior form of money.",
  "tags": [
    ["d", "the-bitcoin-standard"],
    ["title", "The Bitcoin Standard"],
    ["image", "https://blossom.example.com/bitcoin-standard-cover.webp"],
    ["url", "https://blossom.example.com/bitcoin-standard.epub"],
    ["m", "application/epub+zip"],
    ["author", "Saifedean Ammous"],
    ["summary", "The decentralized alternative to central banking."],
    ["published_at", "1525132800"],
    ["t", "bitcoin"],
    ["t", "economics"],
    ["l", "en"],
    ["isbn", "978-1119473862"],
    ["alt", "Ebook: The Bitcoin Standard"]
  ]
}
```

---

## Cross-Linking

Magazine issues reference their parent magazine via the `a` tag using the NIP-01 addressable coordinate format:

```
34609:<publisher-pubkey>:<magazine-d-tag>
```

Clients can query all issues of a magazine with:

```json
{ "kinds": [39731], "#a": ["34609:<pubkey>:<d>"] }
```

And they can query all ebooks by a topic with:

```json
{ "kinds": [33953], "#t": ["bitcoin"] }
```

---

## File Hosting

All files (PDFs, EPUBs, cover images, logos) SHOULD be uploaded to [Blossom](https://github.com/hzrd149/blossom) servers (via BUD-02 `PUT /upload`) and referenced by their canonical Blossom URL. The `x` tag (SHA-256) SHOULD be provided for integrity verification.

Cover images SHOULD be in `image/webp` or `image/jpeg` format, at a 2:3 aspect ratio (portrait), at least 400px wide.

If no cover image is provided by the publisher, clients SHOULD render the first page of the PDF as a cover image and upload it to Blossom before publishing the issue/ebook event.

### Multi-Server Mirroring

To improve resilience, files SHOULD be uploaded to **multiple** Blossom servers simultaneously. When a file has been mirrored, events SHOULD include:

- One `url` tag per mirror, in addition to the primary `url` tag. Clients display / download from the first `url` that responds.
- A `blossom` tag containing a [BUD-10](https://github.com/hzrd149/blossom/blob/master/buds/10.md) `blossom:` URI that encodes the SHA-256 hash, file extension, all mirror domains as `xs=` params, the uploader's pubkey as `as=`, and the file size as `sz=`.

The `blossom` tag is informational and OPTIONAL; clients that do not understand it MUST ignore it.

### BUD-10 `blossom:` URI

The `blossom` tag value follows the BUD-10 URI schema:

```
blossom:<sha256>.<ext>?xs=<domain>[&xs=<domain>...]&as=<pubkey>&sz=<bytes>
```

| Component | Description |
|-----------|-------------|
| `<sha256>` | 64-character lowercase hex SHA-256 of the file |
| `.<ext>` | File extension (e.g. `.pdf`, `.epub`, `.jpg`); defaults to `.bin` if unknown |
| `xs=<domain>` | Domain of a Blossom server where the blob is available (one per mirror) |
| `as=<pubkey>` | Hex pubkey of the uploader; enables BUD-03 server-list discovery |
| `sz=<bytes>` | File size in bytes for pre-download verification |

#### Example — Magazine Issue with mirrors

```json
{
  "kind": 39731,
  "tags": [
    ["d", "2024-05"],
    ["title", "Bitcoin Magazine — May 2024"],
    ["issue", "May 2024"],
    ["a", "34609:ab12cd...:bitcoin-magazine"],
    ["image", "https://blossom.primal.net/deadbeef...webp"],
    ["url", "https://blossom.primal.net/deadbeef...pdf"],
    ["url", "https://cdn.satellite.earth/deadbeef...pdf"],
    ["url", "https://blossom.ditto.pub/deadbeef...pdf"],
    ["m", "application/pdf"],
    ["size", "14285714"],
    ["x", "deadbeef..."],
    ["blossom", "blossom:deadbeef....pdf?xs=blossom.primal.net&xs=cdn.satellite.earth&xs=blossom.ditto.pub&as=ab12cd...&sz=14285714"],
    ["alt", "Magazine Issue: Bitcoin Magazine — May 2024, Issue May 2024"]
  ]
}
```

#### Updated Tag Tables

The `url` and `blossom` tags for Magazine Issue (kind 39731):

| Tag | Req | Description |
|-----|-----|-------------|
| `url` | **required** | URL of the PDF file on a Blossom server. MAY appear multiple times (one per mirror). |
| `blossom` | optional | BUD-10 `blossom:` URI encoding hash, mirrors, author pubkey, and size. |

The `url` and `blossom` tags for Ebook (kind 33953):

| Tag | Req | Description |
|-----|-----|-------------|
| `url` | **required** | URL of the ebook file (PDF or EPUB). MAY appear multiple times (one per mirror). |
| `blossom` | optional | BUD-10 `blossom:` URI encoding hash, mirrors, author pubkey, and size. |

---

## Paid Ebooks (NIP-99)

An ebook may be offered for sale with a standard [NIP-99](https://github.com/nostr-protocol/nips/blob/master/99.md) kind 30402 classified listing. No new kind is introduced. The listing uses the **same `d` tag** as the ebook and adds:

| Tag | Req | Description |
|-----|-----|-------------|
| `d` | **required** | Same identifier as the ebook event. |
| `price` | **required** | `["price", "<sats>", "SAT"]` — the price in satoshis. `0` means free. |
| `a` | **required** | Ebook coordinate: `33953:<pubkey>:<d>`. |
| `k` | optional | `"33953"` — the kind of the referenced ebook. |
| `status` | optional | `"active"` (default) or `"sold"` (listing deactivated). |
| `title`, `summary`, `image`, `published_at`, `t` | optional | Same meaning as on the ebook. |

Example:

```json
{
  "kind": 30402,
  "tags": [
    ["d", "the-bitcoin-standard"],
    ["title", "The Bitcoin Standard"],
    ["summary", "The decentralized alternative to central banking."],
    ["price", "2100", "SAT"],
    ["a", "33953:ab12cd...:the-bitcoin-standard"],
    ["k", "33953"],
    ["status", "active"],
    ["t", "bitcoin"]
  ],
  "content": "The decentralized alternative to central banking."
}
```

### Payment

Payment uses [NIP-57](https://github.com/nostr-protocol/nips/blob/master/57.md) Lightning zaps against the listing. The buyer does not need a Nostr account: the client generates an ephemeral key, signs a kind 9734 zap request with `p` = seller, `a` = listing coordinate, and `amount` in millisats, then requests an invoice from the seller's LNURL-pay endpoint. The seller's wallet publishes a kind 9735 receipt; clients SHOULD treat a receipt as proof of purchase only when it matches the listing coordinate, the buyer's ephemeral pubkey (`P` tag or signed `description`), the price, and the LNURL endpoint's advertised `nostrPubkey`.

Because ebook files live on public Blossom mirrors, this scheme cannot prevent a technically skilled visitor from finding the file URL without paying. It provides a low-friction honour-paywall, not encrypted delivery.

---

## Querying Summary

| Goal | Filter |
|------|--------|
| All magazines | `{ kinds: [34609] }` |
| Magazines by topic | `{ kinds: [34609], "#t": ["bitcoin"] }` |
| Issues of a magazine | `{ kinds: [39731], "#a": ["34609:<pubkey>:<d>"] }` |
| All ebooks | `{ kinds: [33953] }` |
| Ebooks by author pubkey | `{ kinds: [33953], authors: ["<pubkey>"] }` |
| Ebooks by topic | `{ kinds: [33953], "#t": ["fiction"] }` |
| Sale listing for an ebook | `{ kinds: [30402], authors: ["<pubkey>"], "#a": ["33953:<pubkey>:<d>"] }` |
| Payment receipts for a listing | `{ kinds: [9735], "#a": ["30402:<pubkey>:<d>"] }` |
