# Suit and Tie Fashion Shop storefront and store studio

The website brand is **Suit and Tie Fashion Shop**, with production URL **https://suitandtiefashionshop.com**. `VITE_BRAND_NAME` and `VITE_SITE_URL` configure the frontend defaults. The wordmark uses two lines to fit mobile navigation, and the favicon uses a tie symbol. Update the root `.env` host and HTTPS origin settings when deploying; adding the domain to the project does not register it or publish the website.

A React customer storefront and owner dashboard connected to the Django API in the parent directory. Product records, variant availability, prices, cart totals, orders, payment instructions and reports come from Django. Mobile Money payments to 0784888458 use manual screenshot verification.

## Run locally

Start Django from the repository root in a Windows Command Prompt:

```bat
set DEBUG=True
virtenv\Scripts\python.exe manage.py migrate
virtenv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

In a second terminal:

```bat
cd frontend
npm install
npm run dev
```

Open the **Local** URL printed by Vite, normally **http://127.0.0.1:5173**. If that port is busy, Vite automatically selects the next available port. In PowerShell, use `npm.cmd` if script execution policy blocks `npm.ps1`, and `$env:DEBUG='True'` instead of `set DEBUG=True`. The explicit `virtenv` interpreter avoids the earlier missing-Django environment mismatch.

The Vite dev/preview proxy forwards `/api` and `/media` to `STOREFRONT_BACKEND_URL` (default `http://127.0.0.1:8000`; `.env.example` points it at the Railway backend). Copy `.env.example` to `.env` only if overriding frontend configuration. `VITE_API_BASE_URL` defaults to `/api/v1`; an absolute cross-origin URL requires matching Django CORS configuration. Frontend environment variables are public, so never put secrets in them.

The backend's `DASHBOARD_ADMIN_EMAIL` setting identifies the only allowed administrator. Set it in the root `.env` and restart Django when changing it. Blank disables administrative access. Create that owner account, if it does not already exist:

```bat
virtenv\Scripts\python.exe manage.py createsuperuser
```

Sign in through `/login`; only the configured, active ADMIN account is directed to `/dashboard`. Both the API and Django's internal administration enforce this restriction, even if another account has stale admin flags. Public registration creates CUSTOMER accounts only. Django's internal administration remains at `http://127.0.0.1:8000/django-admin/`.

Optional development demo data, from the repository root:

```bat
virtenv\Scripts\python.exe manage.py seed_store
virtenv\Scripts\python.exe manage.py seed_frontend_images
```

The second command attaches generated photographs only to matching Suit and Tie Fashion Shop Demo products without existing photos. It preserves existing images. The demo merchant is explicitly labeled **DO NOT PAY**. Replace demo catalog, photos and merchant details before launch.

## Architecture

```text
src/api/                 Axios client, JWT refresh, envelope/error handling, API services
src/context/             Authentication, store references, cart/wishlist and notifications
src/hooks/               Abortable resources, debounced inputs, guarded mutations
src/utils/               Currency/date formatting, route and variant helpers
src/components/common/   Buttons, fields, badges, loading/error/empty states, modal, guards
src/components/layout/   Store header, navigation, logo and footer
src/components/product/  Product cards and grids
src/components/checkout/ Totals and payment screenshot upload
src/components/account/  Address forms, order progress, private proofs, reviews
src/pages/               Customer screens
src/pages/dashboard/     Owner workspace, resource forms, catalog and payment management
src/styles/index.css     Shared design tokens, component styles and responsive rules
public/images/           Editorial/demo assets and intentional product fallback
e2e/                     Real Django + Chrome end-to-end tests
scripts/                 Isolated browser-test server launchers
```

React 19, React Router 7, Vite 6, Tailwind 3, Axios, React Hook Form and Lucide. Fonts are self-hosted DM Sans and Manrope, with a Georgia italic editorial accent. Routes load lazily. Context holds session and shared shopping state; request hooks cancel stale reads and expose loading, error and retry states. Administrative forms share declarative field definitions while payment and fulfillment decisions have dedicated pages.

Access tokens stay in memory. Rotating refresh tokens use tab-scoped `sessionStorage`; restoration and concurrent 401 responses share one refresh request. Logout clears local state and attempts server revocation. This matches the existing bearer-token API; HttpOnly cookie authentication would require a coordinated backend change. Role guards improve navigation, while Django remains the authorization boundary.

## Pages and routes

| Audience | Routes and screens |
|---|---|
| Public | `/` editorial home; `/shop` catalog; `/shop/:categorySlug` category/subcategory; `/search`; `/products/:slug` variant selection, gallery and approved reviews |
| Authentication | `/login`, `/register` with safe return paths |
| Guest or customer shopping | `/cart`, `/checkout`, `/payment/:id`, `/orders`, `/orders/:id` |
| Customer wishlist | `/wishlist` (sign-in required) |
| Customer account | `/account`, `/account/profile`, `/account/addresses`, `/account/orders`, `/account/orders/:id`, `/account/wishlist` |
| Store information | `/info/about`, `/info/contact`, `/info/delivery`, `/info/size-guide`, `/info/returns`, `/info/privacy`, `/info/terms` |
| Owner overview | `/dashboard` statistics, sales chart, recent orders, payment queue, low stock and top products |
| Owner catalog | `/dashboard/products`, `/dashboard/products/new`, `/dashboard/products/:id`, `/dashboard/categories`, `/dashboard/brands`, `/dashboard/sizes`, `/dashboard/colors`, `/dashboard/inventory` |
| Owner operations | `/dashboard/orders`, `/dashboard/orders/:id`, `/dashboard/payments`, `/dashboard/payments/:id`, `/dashboard/customers`, `/dashboard/customers/:id` |
| Owner management | `/dashboard/coupons`, `/dashboard/reviews`, `/dashboard/reports`, `/dashboard/settings`, `/dashboard/payment-settings` |

Reusable components include `ProductCard`, `ProductGrid`, `QuantitySelector`, `OrderSummary`, `PaymentProofUploader`, `AddressBook`, `AddressText`, `OrderCard`, `OrderProgress`, `PrivateProof`, `ReviewForm`, `SalesChart`, `ResourceForm`, `Newsletter`, `Modal`, `ConfirmDialog`, `Pagination`, `ProtectedRoute` and shared status/form controls.

## API integration

All paths below are relative to `/api/v1`. `src/api/services.js` centralizes them.

| Capability | Endpoints |
|---|---|
| Session/profile | `auth/register/`, `auth/login/`, `auth/token/refresh/`, `auth/logout/`, `auth/me/` |
| Catalog | `products/`, `products/:slug-or-id/`, `categories/`, `brands/`, `sizes/`, `colors/` |
| Settings | `store/`, `payment-instructions/`; checkout displays the order's immutable instruction snapshot |
| Shopping | `cart/`, `cart/items/`, `cart/items/:id/`, `cart/clear/`, `wishlist/`, `wishlist/items/`, `wishlist/items/:id/` |
| Customer operations | `addresses/`, `checkout/`, `orders/`, `orders/:id/`, `reviews/` |
| Payment proofs | `orders/:id/payment-proof/` multipart upload; `payments/:id/screenshot/` authenticated blob download |
| Owner catalog | `dashboard/products/`, `categories/`, `brands/`, `sizes/`, `colors/`, `images/`, `variants/`, `inventory/` |
| Owner operations | `dashboard/orders/:id/transition/`, `dashboard/payments/:id/verify/`, `dashboard/payments/:id/reject/`, customer/order/payment lists and details |
| Owner management | `dashboard/coupons/`, `reviews/`, `settings/`, `payment-settings/`, `summary/`, `reports/sales/` |

The public product API adds `sold_quantity`, ordering by `-sold_quantity`, and `best_sellers=true`. Its correlated aggregation counts only verified, paid, non-cancelled purchases. No verified sales means the best-seller section stays hidden. Existing endpoints and business rules remain authoritative.

Prices and totals are rendered from API decimal strings. Checkout validates the cart, address and coupon in Django and displays the final order totals before the customer pays. Payment and stock are never marked successful optimistically. Private screenshots are fetched with authorization and rendered as revocable object URLs, not public media links. File inputs restrict supported image formats and 5 MB size; Django performs actual file validation. Uploads allow a longer timeout than ordinary requests.

## Design and responsiveness

| Token | Color |
|---|---|
| Background | `#F5F3EA` ivory |
| Primary text / footer | `#202A33` charcoal |
| Accent / primary action | `#D5EE55` restrained lime |
| Editorial panels | `#B8D2DF` powder blue |
| Secondary blue | `#DCEAF0` |
| Surface | `#FFFFFF` |
| Secondary text | `#626D73` |
| Border | `#DEDFD7` |

CSS variables are the source of truth and are mapped into Tailwind. Fluid containers, responsive typography and breakpoints at 1200, 1023, 767 and 480 pixels support the required viewport sizes. Product/category grids become two columns on mobile; checkout, product detail and dashboard panels stack. Filters open in a native modal; dashboard resource lists and editable stock tables become labeled cards on phones, while dense report tables scroll within their containers. The dashboard uses a compact sticky toolbar, a focus-trapped navigation drawer, and touch-sized form controls. Navigation, forms and dialogs are keyboard accessible, with visible focus, skip links, accessible control labels, dialog focus handling, live notifications and reduced-motion support.

## Validation and production build

The header's **Color theme** selector offers System, Light and Dark on both the storefront and dashboard. System follows operating-system changes; an explicit choice is saved in this browser and shared across tabs. Dark colors are defined in `src/styles/theme.css`; photographs and color swatches are never inverted or dimmed.

On **Products → Add product**, use **Add size** to enter each size, color and stock quantity before saving. New size names are saved for the selected category, and stock codes are generated automatically. Product details and new combinations save in one database transaction. Existing combinations can be changed using **Update stock** or the variant editor. Set quantity to zero for sold-out combinations, or turn off **Available for purchase** to withdraw them. Open product pages refresh stock every 15 seconds while visible and when the shopper returns to the tab; unavailable choices cannot be purchased. The cart and checkout retain their server-side stock checks.

```bat
npm run lint
npm test
npm run test:e2e
npm run build
npm run preview
```

`npm test` uses Node's built-in test runner for variant, redirect and payment/fulfillment boundaries. Playwright starts Django at port 8001 and Vite at 5175, with a separate disposable SQLite database and media under ignored `.e2e-data/`. Each run recreates only that test database. Its owner credentials exist only in that isolated test database. Tests use real API requests and cover checkout, proofs, owner verification, fulfillment, review moderation, catalog CRUD, guards and responsive pages. An installed Chrome is used on this Windows machine; elsewhere install Playwright Chromium with `npx playwright install chromium`. Set `E2E_PYTHON` if the project's Python environment lives elsewhere. These local browser settings are never production settings.

Build output is `dist/`. Serve it as a static SPA behind HTTPS, with a fallback to `index.html` for customer/dashboard routes. Proxy `/api/` to Django, serve public `/media/` appropriately, and preserve protected screenshot requests through Django. Do not expose `private_media/` or `.e2e-data/`. Configure Django's production PostgreSQL, allowed hosts, CORS if needed, secrets, email and storage using the root README. Vite's development proxy is not a production reverse proxy.

If port 5175 is occupied during browser testing, set `E2E_FRONTEND_PORT` to a free port. Both owner and shopper browser contexts use that same test origin; the isolated Django backend remains on port 8001.

See [VALIDATION.md](VALIDATION.md) for final execution results and [ASSETS.md](ASSETS.md) for generated image prompts and provenance.

## Remaining business assumptions

- Newsletter registration has no backend endpoint. The email form is visibly disabled and does not collect addresses or claim subscriptions.
- Returns/refunds, exact garment measurements and store legal policies require owner-provided terms. Information pages identify unpublished details and direct customers to store support rather than inventing promises.
- Registration/login follow the backend's existing behavior. Password-reset email endpoints are not present.
- Generated catalog photographs are demo illustrations, not evidence of real stock or exact color variants. Use actual product photography for live sales.
- Best sellers are based on all verified purchases. No rankings or purchase history are seeded to manufacture popularity.
- Large reference lists are paginated when loaded; a very large catalog may warrant server-backed autocomplete controls in administrative forms.
- Local validation uses SQLite; payment/inventory concurrency must use PostgreSQL in production and in the existing PostgreSQL CI tests.

Guest checkout requires delivery details, but no registration or login. Guest bags, orders and proof uploads use a private browser session; customers can return through My orders in the same browser. Clearing site data removes guest access, so keep the order number for support. Account login, registration, credentials and dashboard guards remain available. Guest and account bags are separate.

On **Products ? Add product**, choose a **Product image** (JPG, PNG or WEBP up to 5 MB) and review the preview before saving. The photo, product details and initial stock save together; the image becomes primary and appears on public product cards and the product page. After saving, use **Product photography** to add more images or choose another primary image. Multipart product requests encode `new_variants` as a JSON array alongside the `image` file.
