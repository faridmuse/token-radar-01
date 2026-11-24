# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/faridmuse/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/faridmuse/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

Token Radar ranks every pre-token protocol in a sealed DefiLlama snapshot by the implied value of
the token it may one day launch — and shows a reader how to farm each one before it does.

## What it does

- Reads the sealed snapshot (`/input/snapshot.json`, 758 protocols fetched once from DefiLlama).
- Ranks all 198 pre-token protocols the snapshot can rank: the 40-protocol watchlist (TVL ≥ $50M,
  no token on record, not a wrapped/staked/bridged product of a token that already trades) plus
  every other pre-token protocol below the floor that passes the same rule.
- Prices each token with a **comparables model** (`radar-2-comps`): the multiple is the median
  market-cap-per-TVL of the live-token protocols in the same category (falling back to the median
  over all live-token protocols for thin categories), adjusted by seven-day TVL growth and by how
  long the protocol has run with no token. No protocol name is special-cased; every multiple is
  computed from the snapshot at run time.
- Gives every protocol a seven-step farm plan with concrete costs and times, derived from its
  category, chains, TVL and age.
- Sets the 24 largest live-token protocols aside with their market caps — the market's own values,
  and the comparables that price the board.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <path to snapshot.json>
```

`main.ts` (Node 22, standard library only) writes `out/board.json` (the ranked board),
`out/data.js` (the dashboard's data), copies `dashboard/` and `screenshots/` to `out/`, and writes
`out/dossier.json` with the vendored `vendor/makefun-board.ts`. Open `out/dashboard/index.html` in a
browser — the page renders with no network.

## The dashboard

`dashboard/` is a static page: a sortable, filterable board (search, category, chain, watchlist-only
scope, pre-token / live-token tabs), a detail view for every protocol with the model's own inputs
and its farm plan, and a model panel that states the formula and lists every category's multiple
with its comparables.

## Files

- `main.ts` — the entrypoint the grader runs.
- `lib/model.ts` — the comparables model, the farm plans, the snapshot parser.
- `vendor/makefun-board.ts` — make.fun's dashboard-dossier library (vendored).
- `dashboard/` — `index.html`, `app.css`, `app.js`.
- `screenshots/` — the board, a protocol's detail view, a filtered view.

---

<sub>Entered on [make.fun](https://make.fun/?ref=ms3zd0fn&utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
