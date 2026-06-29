# presence

A page with a quiet placeholder text box, surrounded by rotating 3D shapes —
one shape per person currently viewing the page. The page only shows the
room when it's within a scheduled open window; otherwise it shows a simple
"closed for now" message. The schedule is set in advance and enforced by
the server, so it works correctly even if you have no internet access when
a window opens or closes.

## What's inside

- `schedule.json` — the list of open windows, in UTC. Edit this file to set
  when the page is open. No code knowledge needed beyond editing dates.
- `app/layout.js` — the root layout; imports `globals.css` (required for any
  styling to apply at all — if styling ever goes missing again, check this
  file first)
- `app/page.js` — the page itself (shapes, placeholder text box, closed state)
- `app/api/status/route.js` — lightweight read-only endpoint: is it open right
  now, and who's currently viewing
- `app/api/heartbeat/route.js` — visitor check-in endpoint, called every few
  seconds by each open tab to say "I'm still here"
- `lib/schedule.js` — compares the current server time against `schedule.json`
- `lib/redis.js` — connects to Upstash Redis for shared visitor state
- `lib/shapes.js` — the 3D shape geometry (cube / pyramid / diamond / blob)

## Dependency versions and security

This project runs on **Next.js 15.5.18** and **React 19.0.0**, with a
`postcss` override pinned to `^8.5.10` in `package.json` to close a known
PostCSS XSS advisory that ships nested inside Next.js itself. As of the
last check (June 2026), `npm audit` reports zero vulnerabilities on this
exact dependency set.

Next.js issues security patches periodically. If you're troubleshooting
something odd months from now, it's worth running:
```
npm audit
```
and checking https://vercel.com/changelog for any newer security release
that might apply. If a future Next.js version requires upgrading, do it in
a separate step from any other change, then run through the checks in
"Verifying things still work" below before considering it done — Next.js
major/minor upgrades have a real history of introducing breaking changes
even when described as minor.


## Setting your schedule

Right now `schedule.json` is set to **always open** — one window starting
in 2020 and ending in 2099, so the page never closes. No action needed if
that's what you want.

Whenever you do want to restrict it to specific times, replace that window
with one or more real ones. Each window looks like:

```json
{
  "label": "Saturday opening",
  "start": "2026-07-04T22:00:00Z",
  "end": "2026-07-05T01:00:00Z"
}
```

**All times are UTC — not your local time, and not the visitor's local
time.** UTC is the one global reference point that doesn't shift with
daylight saving or depend on where anyone is sitting, so it's what the
server checks against. You convert your local time to UTC once, when you
write the schedule.

### The date/time format, plain-language

Each `start` and `end` is written as:

```
YYYY-MM-DDTHH:MM:SSZ
```

Spelled out:
- `YYYY-MM-DD` — the date: 4-digit year, 2-digit month, 2-digit day
- `T` — just a separator, always the letter T
- `HH:MM:SS` — the time in 24-hour format (so 6pm is `18:00:00`, not `06:00:00`)
- `Z` — means "this time is UTC" — always keep this letter at the end

### Three worked examples

**Example 1 — a single afternoon, no midnight crossing**
You want the page open from 2pm to 4pm UTC on July 4, 2026:
```json
{ "label": "July 4 afternoon", "start": "2026-07-04T14:00:00Z", "end": "2026-07-04T16:00:00Z" }
```

**Example 2 — a window with a half-hour start time**
You want it open from 9:30am to 11:00am UTC on July 11, 2026:
```json
{ "label": "July 11 morning", "start": "2026-07-11T09:30:00Z", "end": "2026-07-11T11:00:00Z" }
```

**Example 3 — a window that crosses midnight UTC**
You want it open from 10pm UTC on July 20 through 1am UTC the *next*
calendar day. Notice the date itself changes between `start` and `end`:
```json
{ "label": "Late night July 20-21", "start": "2026-07-20T22:00:00Z", "end": "2026-07-21T01:00:00Z" }
```

### Converting from your own timezone

Pick whichever is easiest:
- Search "[your time and date] in UTC" (e.g. "8pm July 4 2026 New York time in UTC")
- Use a converter site like timeanddate.com's time zone converter
- Remember that daylight saving time changes the offset — New York is
  UTC-4 in summer (EDT) but UTC-5 in winter (EST), for example. Always
  convert for the specific date, not a fixed offset you memorize once.

### Adding, editing, or removing windows

The `windows` array can hold as many entries as you like — just add or
remove `{ "label": ..., "start": ..., "end": ... }` blocks, separated by
commas. Delete the three example windows once you've added your real ones.
Commit and push (or redeploy in Vercel) whenever you change this file —
the server only re-reads it on deploy, not live.

## Deploying to Vercel

1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. In Vercel, "Add New Project" → import that repo. Defaults are fine
   (Next.js is auto-detected).
3. Set up shared visitor storage (so the count/shapes work across everyone's
   browsers — see below). Without this step the site still works, but each
   visitor will only ever see themself.
4. Deploy.

## Setting up shared storage (Upstash Redis)

This is what lets every visitor's browser see the same live list of who's
currently on the page.

1. In your Vercel project dashboard, go to **Storage** → **Create Database**
   → choose **Upstash** → **Redis**. Pick the free tier.
2. Vercel automatically adds two environment variables to your project:
   `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. You don't need
   to copy these yourself — Vercel wires them in for you.
3. Redeploy the project once (Vercel → Deployments → Redeploy) so the new
   environment variables take effect.

That's it — no code changes needed. The app already reads those two
environment variable names directly.

If you skip this step entirely, the site still works as a single-visitor
preview but `storageOk` will read `false` and the shared counting won't
function across different browsers/devices.

## Adding your real text

Open `app/page.js` and find this block (currently filled with placeholder
lorem ipsum text so you can preview the layout):

```js
<div className="pr-textbox" style={{ opacity: showRoom ? 1 : 0 }}>
  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
  enim ad minim veniam, quis nostrud exercitation ullamco.
</div>
```

Replace the lorem ipsum sentences with your real words — leave the
`<div className="pr-textbox" style={{...}}>` line and its closing `</div>`
exactly as they are, just swap what's between them. It deliberately has no
border, background, or styling beyond centering — just a quiet area
floating above the shapes.

## Verifying things still work

After any change — editing the schedule, updating dependencies, editing
`page.js` or `globals.css` — it's worth checking these three things before
considering the change done:

1. **Open the homepage.** It should show a warm cream background with a
   monospace font (not the browser's default serif/white background — if
   you see that, `app/layout.js` likely lost its `import './globals.css'`
   line, which is what makes all styling apply at all).
2. **Open `/api/status` directly in a browser tab** (e.g.
   `https://yoursite.vercel.app/api/status`). It should return JSON like
   `{"open":true,"nextWindow":null,"visitorIds":[],"storageOk":false}`.
   If this returns an error page instead of JSON, something broke in the
   API route itself, not the page.
3. **Check `storageOk`** in that same response. `true` means Upstash Redis
   is connected and multi-visitor counting works. `false` means it isn't —
   the page still works, but everyone only ever sees themselves.

If something looks wrong, check the browser console (right-click →
Inspect → Console) for red errors, and check the Vercel deployment's build
log (Deployments → click the deployment → view the log) for anything
other than a normal `Compiled successfully` / route list — a build that
finishes in under a second almost always means the project files aren't
actually where Vercel expects them (check the **Root Directory** setting
in Project Settings → General).

## Local development

```
npm install
npm run dev
```

Visit `http://localhost:3000`. Without Upstash env vars set locally, you'll
see yourself as the only visitor, which is expected.
