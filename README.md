# Imposter Who

A party game: everyone but one player ("the Imposter") sees the same secret
word. Take turns giving one-word hints, then vote out who you think doesn't
actually know it.

## Stack

- **Next.js (App Router)** — client UI (`app/`, `components/`)
- **Standalone room server** (`server/index.ts`) — a plain `ws`/Node server
  that runs the exact same game logic as `party/room.ts` (originally written
  for PartyKit, reused unmodified). Each room is a single in-memory state
  machine keyed by room code — no database needed. Deployed to Fly.io.
  > This project originally targeted PartyKit's shared hosting, but that
  > shared `partykit.dev` zone hit Cloudflare's org-wide 10,000-custom-domain
  > cap and stopped accepting new deploys — see `server/index.ts` for the
  > adapter that lets `party/room.ts` run standalone instead.
- **partysocket** — client library that connects to the room server. It's a
  generic reconnecting-WebSocket client (not Cloudflare-specific), so it
  works unchanged against `server/index.ts`.

## Running locally

You need **two processes**: the Next.js app and the room server.

```bash
npm install
npm run dev:all   # runs both `next dev` and the room server together
```

Or run them separately in two terminals:

```bash
npm run dev          # Next.js on http://localhost:3000
npm run server:dev   # room server on http://localhost:1999
```

Open http://localhost:3000, open it again in a couple more tabs (or on your
phone on the same network), create a room, and join with the other tabs —
you need **3+ players** before the host can start.

## Deploying

The Next.js app goes on Vercel; the realtime room server (`server/index.ts`)
needs a host that supports WebSockets. **Render.com's free tier** works with
no credit card:

1. Push this repo to GitHub (it includes `render.yaml`).
2. On [render.com](https://render.com) (sign in with GitHub, no card): **New →
   Blueprint → pick this repo → Apply**. Render reads `render.yaml` and deploys
   the room server, giving you a host like `imposter-who-server.onrender.com`.
3. In your Vercel project → **Settings → Environment Variables**, set
   `NEXT_PUBLIC_PARTYKIT_HOST` to that host (just the host, no `https://`), then
   **redeploy** the Vercel app.

> Render's free tier sleeps after ~15 min idle, so the first person to join a
> room after a quiet spell waits ~50s while it wakes, then it's instant. For an
> always-on free server, deploy the room server to Cloudflare Workers +
> Durable Objects instead (a bigger change — ask if you want it).

## Game flow

`lobby → reveal-word → hints (3 rounds) → voting → reveal-imposter`

- **Lobby**: players join with a name; host starts once 3+ are connected.
- **Reveal word**: everyone privately sees the word (and category) except
  the imposter, who's told they're the imposter instead.
- **Hints**: turn order is shuffled once per round; each player submits one
  hint, in order, for 3 rounds.
- **Voting**: everyone votes for who they think is the imposter. Votes are
  overwritable at any time (so a tie can be broken by people changing their
  mind) — the host decides when to lock it in and reveal.
- **Reveal**: an animated reveal shows who the real imposter was, and
  whether the group's vote was correct.

All game logic (turn enforcement, who can vote, who can start/reveal) is
server-authoritative in `party/room.ts` — the client only ever renders what
the server sends, so there's no way to peek at the word by inspecting
client-side state.

## Project structure

```
party/room.ts       — the room server (all game logic + state)
party/types.ts       — shared client/server message + state types
party/words.ts       — word/category bank
hooks/useRoom.ts      — client hook wrapping the PartySocket connection
components/           — one component per game phase (Lobby, WordReveal,
                        HintRound, VotingGrid, RevealAnimation) + shared UI
app/page.tsx          — home screen (create/join room)
app/room/[code]/     — the game screen
```
