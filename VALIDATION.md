# Frontend validation

## Suitandtiefashionshop branding - 11 September 2026

- Replaced website branding in storefront pages, wordmark, footer, placeholder artwork, favicon, metadata, Django Admin and API title.
- Configured `https://suitandtiefashionshop.com` in site metadata and links, with apex/www hosts and HTTPS origins in backend configuration. DNS and hosting remain separate.
- Applied `core.0002_rebrand_store` to rename saved store/demo brand records while preserving products and accounts. Seed idempotency passed.
- Frontend lint and production build passed. Chrome storefront checks passed at 360, 390, 768, 1024, 1280 and 1440 pixels, including search, route protection, no horizontal overflow and no browser console errors.
- Django checks, migration consistency, schema validation and Python lint passed. Both domain host checks returned HTTP 200, as did the running local store API.
- Home previews have been refreshed; payment/dashboard previews are historical from the original validation.

## Sole administrator update - 11 September 2026

The configured owner email is enforced by the dashboard API, private proof downloads and Django Admin. The frontend uses the API's read-only `can_access_dashboard` capability for guards, navigation and login redirects. Public registration cannot grant this capability. Passwords are stored using Django's password hashing.

- Backend suite: **60 passed, 2 PostgreSQL-only checks skipped** (62 discovered), including 8 new owner access tests.
- Frontend lint and production build: **passed**.
- Owner browser regression: **passed** on isolated port 5179, covering login redirect, dashboard access, concurrent token refresh, product/image/variant creation, public stock updates and deletion. Both browser contexts follow the selected test port.
- Changed Python files: Ruff lint and format checks **passed**.
- Updated OpenAPI schema: validation **passed**.
- Local account verification: password authentication succeeded, exactly one ADMIN account exists, and the running frontend proxy returned HTTP 200 for the owner's profile and dashboard summary with owner capability enabled.

The original broader storefront validation below was completed on 10 September.

Validated locally on Windows on 10 September 2026, using Node 20.11.1, installed Chrome and the project's Python 3.10 virtual environment.

| Check | Result |
|---|---|
| `npm install` | Completed; lockfile included; dependency audit reported **0 vulnerabilities** |
| `npm run format` | Completed |
| `npm run lint` | Passed with no errors or warnings |
| `npm test` | **4 tests passed** |
| `npm run build` | **Passed**, Vite 6.4.3; final build completed in 11.76 seconds |
| `npm run test:e2e` | **4 browser scenarios passed**, 3.8 minutes |
| Django API suite | **54 discovered: 52 passed, 2 PostgreSQL-only concurrency checks skipped on SQLite** |
| Strengthened best-seller aggregation test | Passed, including multiple variants and excluding unverified sales |
| OpenAPI generation and validation | Passed; `schema.yml` updated |
| Ruff checks on changed Python files | Passed; six files formatted |
| Development API smoke check | Port 8000 returned HTTP 200 for store settings and best-seller catalog |

The production output is `dist/`. Final entry assets are approximately 268 kB JavaScript (87.4 kB gzip), 51.5 kB shared React/router JavaScript (18.2 kB gzip), and 63.3 kB CSS (13.4 kB gzip), plus lazy page chunks, self-hosted fonts and image assets.

## Real browser coverage

No production API data is mocked. Tests start an isolated Django server on port 8001 and a Vite server on port 5175. Their disposable SQLite database is recreated under `.e2e-data/`; the normal project database is preserved. Test media, customers, credentials, orders and payments are confined to that environment. Test-only authentication rate limits allow repeated loopback sessions without changing production throttles.

1. Owner login; deliberately invalid access token; concurrent requests recover through one real refresh; create a product; upload an image; create a priced size/color variant; verify its public image, price and stock; set stock to zero; verify purchasing becomes unavailable; delete the test product.
2. Home and shop at **360, 390, 768, 1024, 1280 and 1440 pixels**; real category/product counts; no horizontal overflow; empty search; anonymous dashboard protection; no browser page or console errors.
3. Customer registration, session restoration, role guard, wishlist, bag and quantity changes; **mobile checkout and address entry**; real order creation; merchant instruction snapshot; screenshot upload; owner views private proof and verifies payment; processing, shipped and delivered transitions; customer submits a review; owner approves it; review appears publicly; stock decreases by the purchased quantity and a repeated verification does not deduct it again; mobile order and dashboard layout; no unexpected browser page or console errors.
4. Brand create/edit/delete and all dashboard management routes; successful navigation and error-free rendered states.

The access-refresh scenario intentionally produces authentication 401 responses before recovery. Ordinary storefront and checkout flows assert an empty browser error list. Payment testing verifies the application's manual workflow; it does not send money to a merchant.

## Saved previews

- [Desktop home](screenshots/home-desktop.png)
- [Mobile home](screenshots/home-mobile.png)
- [Mobile payment](screenshots/payment-mobile.png)
- [Desktop dashboard](screenshots/dashboard-desktop.png)
- [Mobile dashboard](screenshots/dashboard-mobile.png)

The dashboard screenshots show isolated test data. The Playwright HTML report is generated under `playwright-report/`.

## Limits

No production deployment or real merchant transaction was performed. PostgreSQL row-lock behavior and the Linux GitHub Actions workflow were not executed on this Windows machine. The supplied backend workflow covers PostgreSQL, and `.github/workflows/frontend.yml` runs frontend build and browser checks on Linux. Newsletter subscriptions, password-reset email, returns/refunds and legal-policy publishing need backend/business support as described in [README.md](README.md).
