# Still Open

**Which of the roles you applied to are already closed?**

Job boards hand you off to a company and go quiet. Nobody tells you when the
req gets pulled, so you sit on a dead application for three weeks wondering why
nobody wrote back.

Still Open tracks the roles you applied to and checks, every time you open it,
whether each one is still live.

## Why this and not another matcher

The tools in this space all stop at the moment you apply. career-ops scores
jobs against your CV and you press Submit. Tsenta applies for you. Jack & Jill
makes the introduction. None of them come back afterward.

The gap is everything that happens after. This fills the smallest useful piece
of it: telling you which applications are already dead.

## How it works

The [a16z speedrun talent network API](https://speedrun-talent-network.com/developers)
exposes a detail endpoint per role:

```
GET /api/v1/jobs/{id}  →  { "job": { "status": "open" | "closed", ... } }
```

That `status` enum is the whole product. Track a role, and the app asks that
endpoint on every load. Anything that comes back `closed` gets flagged.

Everything else follows from their API being open:

- **No backend.** Read-only, no auth, open CORS, so the browser talks to the
  API directly. The deploy is a static Next.js app.
- **No account.** Your list lives in `localStorage` on your own device. Nothing
  is uploaded, nothing is tracked, there is no server to leak it.
- **Attribution back to the board.** Every call carries `?source=still-open`,
  and every outbound link is the canonical URL with `utm_source` and
  `utm_medium` stamped on, which is what their docs ask integrations to do.

## Run it

```bash
npm install
npm run dev
```

## Stack

Next.js 16, React 19, TypeScript, no UI libraries, no state library, no
database. Two files hold the logic: `lib/api.ts` is the API client and
`lib/store.ts` is the browser store.

## What's next

- Import applications that did not come from the board, so the whole search
  lives in one place
- Follow-up reminders on roles still open past a set number of days
- A weekly digest of what closed while you were waiting

## Built by

Emmanuel Darkwa, for the a16z speedrun talent team's Product Engineer
application. Built while job hunting, which is the only reason the idea exists.
