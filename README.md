# Rightmo Web

Next.js 16.4.3, React 19.3, TypeScript, and Tailwind product workspace. Companion backend: [rightmo-api](https://github.com/ccdilan/rightmo-api).

## Start

For the complete Docker application, clone both repositories as siblings and follow the [API setup instructions](https://github.com/ccdilan/rightmo-api#run-the-complete-application). The frontend is at [localhost:3000](http://localhost:3000). Demo login: **demo@rightmo.test** / **RightmoDemo!2026** after explicitly seeding the backend.

For native development with Node 22:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The API must be running at `API_INTERNAL_URL` (default `http://127.0.0.1:8080`). `APP_ORIGIN` is the exact browser origin allowed to submit mutations, default `http://localhost:3000`; use that hostname consistently. `DISPLAY_CURRENCY` defaults to `USD`. It controls formatting only and does not convert stored prices. Environment variables are server-only; no API token or backend secret is exposed as a `NEXT_PUBLIC_` variable.

## API documentation

The backend provides **[Scribe API documentation](http://localhost:8080/docs/)** with endpoint descriptions, validation rules, example responses, and **Try it out**. Download its [OpenAPI specification](http://localhost:8080/docs/openapi.json) or [Postman collection](http://localhost:8080/docs/collection.json).

Docker generates the documentation during the API build. For native development, run `composer docs` from the sibling `rightmo-api` repository. Follow the [API documentation workflow](https://github.com/ccdilan/rightmo-api#api) when updating endpoint contracts.

The documentation's API tester uses a bearer token obtained from its login endpoint. The Next.js application's token remains in its HttpOnly cookie.

## Features

- Login with password visibility control, logout, expired-session handling, and protected catalog/detail data.
- Responsive product cards with category, price, rating, and image.
- Search words in any order, multiple category checkboxes, price/rating filters, sorting, and page-size controls retained in URL parameters. Submit with Apply filters or Enter; criteria changes reset the page. Remove individual applied filters with their chips. Refresh and Back preserve selections.
- Numbered pagination, first-page recovery after the catalog changes, and layout-shaped loading skeletons for catalog/detail/forms.
- Product creation from **Add product**, editing from product details, and deletion with a confirmation dialog. Forms cover name, description, category, price, and rating with field-level validation, focused error summaries, description length guidance, and saving states.
- Category management at **Categories**: search the list, create categories, rename them, inspect product counts, and delete empty categories with confirmation. Categories containing products link to those products and cannot be deleted until the products are reassigned or removed. Changes refresh product forms and catalog filters.
- Dynamic product details and image upload/replacement, with a local preview, file size, clear-selection control, immediate type/size feedback, pending/error/success states, and refreshed product data. Preview URLs are released when replaced or hidden; the server still validates actual file content.
- Missing-image fallback, empty results, invalid filters, missing products, and retryable service errors.
- Keyboard-friendly forms, visible focus, skip navigation, and reduced-motion support.

All authenticated users can manage the shared catalog and categories. Renaming a category preserves its product assignments. Create a product first, then upload its image from the details page. Editing preserves the existing image; deleting a product also removes its image. The delete dialog supports keyboard navigation and Escape to cancel. Successful writes refresh the catalog and details.

## Authentication and data flow

Browser → same-origin Next.js handler → Laravel bearer-token API.

Login exchanges credentials on the Next.js server and stores the resulting eight-hour Sanctum token in a host-only HttpOnly SameSite=Lax cookie. Secure is enabled whenever `APP_ORIGIN` uses HTTPS. The browser receives user details and a validated local redirect path, never the token. Every browser mutation checks the exact Origin; login, logout, product/category creation/update/deletion, and upload use explicit handlers rather than a general-purpose API proxy. Product handlers forward only editable fields, enforce a 64 KiB JSON limit, and preserve Laravel field errors. Category handlers forward only the name and enforce an 8 KiB JSON limit. New/edit/category routes recheck authentication at data access and can be resumed after sign-in through validated local return URLs. Logout revokes the backend token and clears the cookie. An unavailable backend leaves logout retryable.

Server Components read the cookie and fetch Laravel with `cache: no-store`. Protected data access validates the token through Laravel even if a cookie exists. Redirects on 401 distinguish expired sessions from service failures. Cached components provide only the static shell; protected data stays behind Suspense boundaries and is not shared across requests. Image URLs are public assets; `next/image` renders them unoptimized so a browser can load local Docker assets without an image-optimization proxy.

The application uses small client components for forms, filters, uploads, and image fallback. Shared server-only modules handle upstream communication and cookie policy. The server controls the currency configuration. Layouts and pages stay server-rendered. API errors preserve validation messages while network failures receive a retryable message.

## Verification

```sh
npm run lint
npm run types:check
npm test
npm run build
npm start
# Against the seeded Docker stack:
npm run test:integration
```

Unit tests exercise safe redirects (including new/edit forms), exact origin checking, combined filter serialization, individual-filter removal, bounded page navigation, currency formatting, image preflight checks, request size boundaries, and product field filtering. The product integration test verifies login cookies/token privacy, CSRF rejection, protected forms, create/update/delete through Next.js, field errors and duplicate names, partial updates, large descriptions, invalid uploads, image replacement/deletion, logout, and expired-session mutations using a temporary product. The category integration test covers authenticated CRUD, duplicate names, request limits, product counts, rename propagation, blocked deletion while products exist, and refreshed product forms. Both scenarios require the demo account and clean up their own fixtures without modifying seeded records.

For a browser acceptance pass: log in, combine a name/category/price filter, change sorting, advance a page, refresh and use Back, create a product, edit its details, upload an image, confirm the updated card in the catalog, cancel a delete dialog, delete the temporary product, and sign out. Repeat at a narrow mobile width and with keyboard navigation. GitHub Actions runs lint, types, unit tests, and the production build on Node 22. Deployment is outside this repository setup.

## Engineering improvements

See [the engineering plan](ENGINEERING_PLAN.md) for the ordered UI/UX, search, accessibility, and performance work with acceptance criteria. Changes are delivered as separate Conventional Commits.

## Verified improvement pass

On 25 October 2026, the frontend passed lint, TypeScript, 12 unit tests, the Docker-backed integration scenario, and the production build. Browser checks covered multiple categories with rating/sort filters, removing one selection, Back/refresh persistence, mobile layout, keyboard focus from validation errors, password visibility, local image preview/clearing, and unsupported-file rejection. Delete confirmations close when their cached detail page is left.

Currency formatting creates one formatter per catalog render and reuses it across cards. Filters submit explicitly to avoid issuing a request for every keystroke. See the [API performance evidence](https://github.com/ccdilan/rightmo-api/blob/main/docs/performance.md) for the bounded SQL-query budget and the measured ordering-index plan. Shared authentication/data caches, responsive image derivatives, full-text search, production load tests, and deployment are not added by this pass.

## Verified category delivery

On 25 October 2026, category management passed lint, TypeScript, 12 unit tests, both Docker-backed integration scenarios, and the production build. Browser checks covered creation, duplicate-name feedback, renaming, updated catalog filters and previously visited product forms, keyboard cancellation, protected deletion controls, and mobile layout. The API passed 52 tests / 468 assertions with 90.4% line coverage, PHPStan, Pint, and Scribe generation.
