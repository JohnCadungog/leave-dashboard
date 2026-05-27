# Skills

This project uses these agent skills, installed via `npx skills add ...` during the pre-flight phase.

---

## vercel-react-best-practices

**Source:** `vercel-labs/agent-skills`
**Location:** `.agents/skills/vercel-react-best-practices/`

62+ rules across 8 categories covering waterfalls, bundle optimization, server-side performance, client-side data fetching, re-render optimization, rendering performance, JavaScript performance, and advanced patterns.

**Invoke when:** Writing data fetching logic, lists, components that re-render frequently, optimizing bundle size, or reviewing any React hot path.

**Key rules applied in this project:**
- `async-parallel` — React Query deduplicates parallel queries automatically
- `bundle-dynamic-imports` — All pages code-split with `React.lazy` + `Suspense`
- `client-swr-dedup` — React Query used for all server data (no manual fetch effects)
- `rerender-memo` — Calendar events memoized with `useMemo`
- `rerender-derived-state-no-effect` — Filter state derived from URL search params, not effects

---

## react-doctor

**Source:** `millionco/react-doctor`
**Location:** `.agents/skills/react-doctor/`

Static analysis tool that scans React codebases for security, performance, correctness, and architecture issues. Outputs a 0–100 health score.

**Invoke when:** Before merging any PR, before final submission, or when asked to run `/doctor`.

**Run command:**
```bash
npx react-doctor@latest . --verbose
```

**Target:** Score ≥ 85, no Critical issues.

---

## react-state-management

**Source:** `wshobson/agents`
**Location:** `.agents/skills/react-state-management/`

Decision guide and patterns for Zustand, Redux Toolkit, Jotai, React Query, and URL state.

**Invoke when:** Introducing any new state. Deciding between state management approaches.

**Decisions made for this project:**
- Server state → React Query (no global store, no manual fetch effects)
- Filter/view state → URL search params via `useSearchParams` (deep-linkable)
- UI-only state → local `useState` (dialogs open/close, form state via react-hook-form)
- No global store needed (Zustand/Redux would be over-engineering for this scope)

---

## react-dev

**Source:** `softaworks/agent-toolkit`
**Location:** `.agents/skills/react-dev/`

React 19 + TypeScript type-safety patterns. Covers component typing, event handlers, hooks, generic components, and routing integration.

**Invoke when:** Typing components, events, hooks, or making React 19-specific decisions.

**Patterns applied in this project:**
- `ComponentPropsWithoutRef<'button'>` for native element extension (Button, Input, etc.)
- Explicit `useState<User | null>(null)` for nullable state
- `as const` for tuple returns in custom hooks
- React 19 `ref` as regular prop (no `forwardRef`)
- Discriminated unions avoided in favor of simpler variant props via CVA
