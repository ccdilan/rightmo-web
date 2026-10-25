# Rightmo engineering improvement plan

## Purpose

Improve the existing shared product workspace in reviewable increments. Preserve the Laravel repository/service boundaries, Sanctum server-held sessions, Next.js Cache Components, MySQL, and both repository histories. Each completed section receives its own Conventional Commit; nothing is pushed.

## Delivery order and acceptance

| Part | Change | Acceptance evidence |
| --- | --- | --- |
| 1. Discovery API | Match up to eight name-search words in any order; combine up to 20 selected categories, price bounds, and minimum rating. Preserve the single-category API parameter. | MySQL feature tests for combinations, literal wildcard handling, validation, pagination, and backward compatibility. Regenerate Scribe/OpenAPI. |
| 2. Catalog UX | Clearly labelled search, multiple category checkboxes, rating and page-size controls, removable applied-filter chips, predictable URL state, useful empty results, and layout-shaped loading states. | URL-policy tests, integration rendering checks, desktop/mobile and keyboard walkthrough, refresh/back navigation. Apply filters explicitly to avoid a request on every keystroke. |
| 3. Forms and images | Clear login/password feedback, accessible error summaries, product description guidance, preview before image upload, and cleanup of temporary browser resources. | Lint/types/build, invalid/success states, keyboard focus and cached navigation checks; existing upload/CRUD integration coverage. |
| 4. Performance | Measure the default listing query; index its stable ordering if justified. Add a bounded query-count regression test and keep authenticated responses uncached. Reuse currency formatters during rendering. | MySQL EXPLAIN evidence, constant query count as page size increases, formatter tests, production build. Record limitations instead of claiming unmeasured speedups. |
| 5. Delivery verification | Refresh both READMEs and record the verified workflows and remaining scale considerations. | API coverage/static analysis/formatting, web lint/types/unit/integration/build, healthy Docker stack, clean Git status. |

## Product decisions

- Search uses AND between whitespace-separated words, case insensitive, with each word treated literally. Selecting categories uses OR. Search, category selection, price, and rating combine with AND.
- Existing `category_id` clients remain supported. New clients use `category_ids[]`; sending both is a validation error.
- Price remains a decimal string. Filters reset pagination; refresh and browser navigation restore the applied URL state.
- Every authenticated user can manage the shared catalog. No roles, bulk deletion, checkout, or registration are added in this pass.
- Keyboard access, readable labels, visible focus, mobile layouts, and retryable failures are acceptance criteria for every UI change.
- No shared caching of private catalog responses or authentication tokens. Database changes must be reversible, and performance claims must have evidence.

## Review and rollback

Read commits in delivery order across the API and web repositories. API additions remain backward compatible so the API can be updated before the UI. Each feature commit includes its focused verification; final documentation records the combined checks. Revert a web feature commit before reverting the API contract it consumes. Schema migrations include a `down` path.

## Technical references

- [Laravel validation](https://laravel.com/docs/13.x/validation): array validation and batched existence checks.
- [MySQL ORDER BY optimization](https://dev.mysql.com/doc/refman/8.4/en/order-by-optimization.html): evaluating index-backed ordering with EXPLAIN.
- [React effect lifecycle](https://react.dev/reference/react/useEffect): releasing browser resources on replacement and unmount.
- Installed Next.js 16.4.3 documentation is the source for Cache Components and navigation behavior.
