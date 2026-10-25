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

- Login, logout, expired-session handling, and protected catalog/detail data.
- Responsive product cards with category, price, rating, and image.
- Search, category/price filters, price/rating sorting, and pagination retained in URL parameters. Submit with Apply filters or Enter; criteria changes reset the page.
- Dynamic product details and image upload/replacement, with inline validation, pending/error/success states, and refreshed product data.
- Missing-image fallback, empty results, invalid filters, missing products, and retryable service errors.
- Keyboard-friendly forms, visible focus, skip navigation, and reduced-motion support.

Creation/editing/deletion of product records are API capabilities, not frontend screens in this scope. The only frontend write besides authentication is image replacement.

## Authentication and data flow

Browser → same-origin Next.js handler → Laravel bearer-token API.

Login exchanges credentials on the Next.js server and stores the resulting eight-hour Sanctum token in a host-only HttpOnly SameSite=Lax cookie. Secure is enabled whenever `APP_ORIGIN` uses HTTPS. The browser receives user details and a validated local redirect path, never the token. Every browser mutation checks the exact Origin; login, logout, and upload use explicit handlers rather than a general-purpose API proxy. Logout revokes the backend token and clears the cookie. An unavailable backend leaves logout retryable.

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

Unit tests exercise safe redirects, exact origin checking, query serialization, and request size boundaries. The integration test verifies login cookies/token privacy, CSRF rejection, protected rendering, invalid uploads, successful image replacement, logout, and cleanup using a temporary product. It requires the demo account and creates/deletes its own product without modifying seeded products.

For a browser acceptance pass: log in, combine a name/category/price filter, change sorting, advance a page, refresh and use Back, open product details, upload an image, return to the catalog, and sign out. Repeat at a narrow mobile width and with keyboard navigation. GitHub Actions runs lint, types, unit tests, and the production build on Node 22. Deployment is outside this repository setup.
