# react-view-transition-group

**[Demo and docs](https://fakundo.github.io/react-view-transition-group/)**

Animate React children as they are added, removed, moved and resized with native,
element-scoped View Transitions (see [Browser support](#browser-support)). Two APIs:

- `ViewTransitionGroup` — a component, animates changes of its children's keys and order;
- `useViewTransitionGroup` — a hook, `[rootRef, startTransition]`, animates any change made
  inside `startTransition`.

Options (component props and hook options): `childVtClass`, `rootVtClass`, `disabled`,
`respectReducedMotion` (default `true`: no transition when the user prefers reduced motion),
`onTransitionStart`, `onTransitionEnd`. `startTransition(update, { types })` returns the
`ViewTransition` or `null`; the component sets the types `add`, `remove` and `move` by itself.

## Compared to `<ViewTransition>` in React

React has its own `<ViewTransition>` component. Both animate with View Transitions, the scope
is different:

|                      | `<ViewTransition>` (React)                                 | `react-view-transition-group`                              |
| -------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| Transition           | `document.startViewTransition`: the whole page             | `element.startViewTransition`: only the group              |
| During the animation | the whole page takes no clicks                             | only the group takes no clicks                             |
| Several at once      | one transition at a time, updates wait for it              | every group runs its own, they do not wait for each other  |
| What starts it       | updates in `startTransition`, `useDeferredValue`, Suspense | `startTransition` of the hook or a change of children keys |
| Urgent `setState`    | not animated                                               | animated: the update runs with `flushSync`                 |
| Shared elements      | yes, by `name` across the page                             | no, children animate inside their group only               |
| Browsers             | every browser with View Transitions                        | browsers with element-scoped View Transitions              |
| React                | the React version that ships `<ViewTransition>`            | 18 and 19                                                  |

Use `<ViewTransition>` for page-level transitions: navigation, shared elements, Suspense reveals.
Use this library for local lists and grids that animate on their own, often and independently,
while the rest of the page stays interactive.

## Development

```
src/
  ViewTransitionGroup.tsx     — the component (built on the hook)
  useViewTransitionGroup.ts   — the hook
  constants.ts, helpers.ts
  *.test.tsx, testUtils.ts    — unit tests (jsdom)
  index.ts                    — library exports
demo/                         — docs page with live examples (main.tsx, examples/)
e2e/                          — browser tests: groups.spec.ts and the test app in app/
vite.config.ts                — library build, dev server and unit tests
playwright.config.ts          — e2e tests in Chromium of Playwright (E2E_CHANNEL: installed one)
.github/workflows/ci.yml      — CI on every push and pull request
```

| Command              | What it does                                               |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Docs at http://localhost:5173                              |
| `npm test`           | Unit tests                                                 |
| `npm run test:e2e`   | E2E tests (once before: `npx playwright install chromium`) |
| `npm run build`      | Type check and build to `dist/` (ESM + CJS + `.d.ts`)      |
| `npm run build:demo` | Docs build to `demo-dist/`                                 |

Git hooks (husky, set up by `npm install`): `pre-commit` formats the staged files with oxfmt
and lints them with oxlint (lint-staged), `commit-msg` checks the message with commitlint.
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat: ...`, `fix(hook): ...`, `docs: ...`). CI checks every pushed commit message, runs the
linter, the format check, unit tests on React 18 and 19, e2e tests in Chromium and both builds.
After all checks of a push to the default branch it publishes the demo to GitHub Pages (once:
Settings → Pages → Source: GitHub Actions).

## Browser support

The library is built on element-scoped View Transitions (`element.startViewTransition()`).
Browsers without them run the same update at once, without animation: nothing breaks, the React
code stays the same.

Which browsers support them: see the
[browser compatibility table on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition#browser_compatibility).

## Limitations

- No clicks during a transition: the browser leaves the group and all of its children out of
  hit testing until the transition ends, so a quick second click inside the group is lost.
  Keep the animations short.
- A group that is its own scroll container ignores the wheel during a transition, unless this
  CSS is added:

  ```css
  ::view-transition {
    pointer-events: none;
  }
  ```

- With reduced motion updates run without a transition, unless `respectReducedMotion` is
  `false`.
- Nested groups and groups in scroll containers work: transitions run independently and are
  clipped by the scroll container.
- The root can not be a table row group: the browser does not run a transition on a `<tbody>`
  with the table layout. Lay the table out with CSS grid instead.
