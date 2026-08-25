# Fixture library

Recorded-step shapes replayed against the **real Oracle HTML** they came from.

```bash
npm run test:fixtures     # ~3s, no network, no credentials, no Oracle
```

Run this **before** every live replay, and after **every** change to the locator
ladder, `unwrapToControl`, `disambiguate`, or `executeAction`.

## Why

A locator bug here fails in the worst possible way: the ladder falls back to
something that resolves, the click lands on inert text, and the step is reported
as a **PASS** while nothing happened. A green run that changed nothing is worse
than a red one.

Diagnosing that from a live run is slow — a replay is minutes, and the test pod
is often unreachable — so the temptation is to reason about the markup from
memory. That produced a confidently wrong diagnosis once already: a fix was
written for `<label>` without `for`, when the real Oracle label *has* `for` and
a caption click works fine. The bug was real, the explanation was not.

Every fixture here is HTML copied verbatim out of the running application. No
invented markup.

## Adding a case

1. In devtools, right-click the element → **Copy → Copy outerHTML**.
2. Save it to `checks/cases/<name>.html`. A fragment is fine; the runner wraps
   it in a document. Add a comment saying where it came from and what is unusual
   about it.
3. Describe the recorded step and what it should do in
   `checks/cases/<name>.cases.json`.
4. `npm run test:fixtures`.

### Case format

```jsonc
{
  "fixture": "address-purpose.html",
  "cases": [{
    "name": "Ordering purpose ticks its own checkbox",
    "pre":  { "check": ["some:id"] },      // optional starting state
    "action": { /* the recorded step, verbatim from the recording */ },
    "expect": {
      "resolvesTo": "INPUT#some:id",        // the single most useful assertion
      "checked":   { "some:id": true },
      "value":     { "other:id": "text" },
      "unchanged": ["neighbour:id"]         // must not have been touched
    }
  }]
}
```

`"knownFailure": "reason"` marks a case the engine currently fails: it is
expected to fail, and the suite goes red if it starts passing. Use it to pin a
bug you have reproduced but not yet fixed.

## What this does and does not prove

**Does:** the recorded selector resolves to the right element; the right control
is acted on; neighbours are untouched; a re-replay does not undo state.

**Does not:** anything about timing. Static HTML cannot reproduce ADF partial
refreshes, a popup that renders 3s late, or a field disabled until its parent
commits. Green here means the **locators** are right, not that the flow replays.

## Gotchas

- **ADF ids contain `:`**, which is a CSS combinator. Always
  `[id="a:b:c"]`, never `#a:b:c`.
- **Some elements are invisible without the application stylesheet.** The LOV
  search icons (`…::lovIconId`) are empty `<a>` tags sized entirely by their CSS
  background — in a bare fragment they measure 0×0 and Playwright calls them
  hidden. Assert on the input they belong to instead.
- The fixtures are verbatim Oracle output, so linters will complain about
  deprecated attributes and layout tables. Leave them exactly as captured.
