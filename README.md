# Imposter Who

A party game: everyone but one player ("the Imposter") sees the same secret
word. Take turns giving one-word hints, then vote out who you think doesn't
actually know it.

## Stack

- **Next.js (App Router)** — client UI (`app/`, `components/`)
- **PartyKit** — the room server (`party/room.ts`). Each room is a single
  stateful server instance keyed by room code — no database needed, state
  lives in memory for the life of the room.
- **partysocket** — client library that connects to the PartyKit room.

## Running locally

You need **two processes**: the Next.js app and the PartyKit room server.

```bash
npm install
npm run dev:all   # runs both `next dev` and `partykit dev` together
```

Or run them separately in two terminals:

```bash
npm run dev        # Next.js on http://localhost:3000
npm run party:dev   # PartyKit room server on http://localhost:1999
```

Open http://localhost:3000, open it again in a couple more tabs (or on your
phone on the same network), create a room, and join with the other tabs —
you need **3+ players** before the host can start.

## Deploying

1. Deploy the room server: `npm run party:deploy` (requires a free PartyKit
   account — `npx partykit login` first). This prints a host like
   `imposter-who.yourusername.partykit.dev`.
2. Set `NEXT_PUBLIC_PARTYKIT_HOST` to that host (see `.env.local.example`)
   in your Vercel project's environment variables.
3. Deploy the Next.js app to Vercel as usual.

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
