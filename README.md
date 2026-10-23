# Everything Beaded & Trading Ventures

A single-merchant storefront and management workspace built with Next.js, Supabase and hosted Paystack Checkout.

## Local setup

Use Node 22 and the pinned pnpm 10.34.5.

```powershell
pnpm install --frozen-lockfile
Copy-Item apps/web/.env.example apps/web/.env.local
pnpm --filter web dev --hostname 127.0.0.1 --port 3100
```

Open http://127.0.0.1:3100. The bundled catalogue contains 806 design groups and 1,473 product photographs. Browsing, search, filtering, galleries and the shopping bag work without a database connection. Materials described from photographs require merchant confirmation; prices and stock remain unknown until entered.

Configure `apps/web/.env.local` for connected operation. Keep credentials in the ignored environment file or the hosting secret store.

| Variable                                               | Purpose                                                                           |
| ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `SUPABASE_URL`                                         | Store project API URL.                                                            |
| `SUPABASE_SECRET_KEY`                                  | Server-only secret key or legacy service-role key.                                |
| `SUPABASE_PUBLISHABLE_KEY`                             | Public Auth key for the same project.                                             |
| `STORE_ORIGIN`                                         | Exact application origin, such as `http://127.0.0.1:3100`; use HTTPS when hosted. |
| `STORE_INDEXABLE`                                      | Keep `false` until public release acceptance.                                     |
| `PAYSTACK_MODE`, `PAYSTACK_SECRET_KEY`                 | Matching test/live environment and payment credential.                            |
| `COMMERCE_JOB_SECRET`                                  | Scheduler credential of at least 32 characters.                                   |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Authenticated receipt email transport. Port 465 uses TLS; 587 requires STARTTLS.  |
| `STORE_EMAIL_FROM`                                     | Verified receipt sender.                                                          |

## Database and catalogue

Use a separate store project. Apply the SQL files in `supabase/migrations` in filename order through the migration workflow for the selected environment. Inspect the target and existing migration history before applying changes; never reset a shared database. `supabase/config.toml` configures disposable local development and does not change hosted Auth settings.

The catalogue importer defaults to a dry run:

```powershell
pnpm catalogue:import
```

For an approved target with migrations already applied:

```powershell
node --env-file=apps/web/.env.local scripts/import-catalogue.mjs --apply --project-ref <store-project-ref>
```

The importer inserts missing records and preserves existing prices, inventory and merchant edits. Product photographs are bundled with the application; new merchant uploads use the `product-images` storage bucket. The image host allowlist is derived from `SUPABASE_URL` when the application builds.

## Merchant operation

Open `/admin/sign-in`. An administrator first approves the exact owner email in `merchant_approvals`; signing up alone does not grant access. Confirm the account email, then enroll and verify an authenticator. Configure exact confirmation/recovery redirects in Supabase Auth, including `http://127.0.0.1:3100/admin/sign-in` for local use and the corresponding HTTPS address for each hosted environment. Auth confirmation/recovery mail requires its own verified delivery configuration.

The workspace provides product details/photos/publication, prices, opening stock, reasoned stock adjustments, orders, customer requests and activity records. Recent authenticator verification is required for private data and changes. Stale revisions are rejected; refresh and review before retrying. Available inventory already excludes checkout reservations.

Each record represents a complete sale unit. Use separate confirmed product records for separately stocked sizes or styles; a shared related-design code links their options. Approve details only after checking identity, size, materials and included pieces.

Paid orders enter preparation after server payment verification. Record a dispatch reference and optional tracking link, then confirm dispatch and delivery. Open cancellation, return or damage requests block dispatch until reviewed and closed. Request replies appear on the customer's order page. Closing a request does not issue a refund or restore stock.

## Payments and service operation

Customer ordering stays closed until approved product details, positive prices, available stock, enabled delivery zones and approved store policies are configured. Store settings also require confirmed country/currency and tax-inclusive pricing. Merchant changes do not open the store automatically.

Configure the Paystack webhook as `https://<store-domain>/api/payments/paystack/webhook`. A browser callback never proves payment. Signed events enter a durable inbox, and server verification checks the reference, amount, currency, environment and customer before marking payment successful.

Schedule a POST to `/api/internal/commerce-jobs` once per minute with `Authorization: Bearer <COMMERCE_JOB_SECRET>`. Allow at least 90 seconds per invocation. Monitor queue backlog, retries and payment reviews. Unknown provider failures retain reservations until reconciled; do not manually mark an uncertain payment paid or release inventory based on a browser redirect.

Guest orders remain private to the checkout browser's cookie. Cross-device recovery, refunds, courier booking, staff administration and support-notification email require separate operating procedures. Account activation, browser acceptance, real provider tests, email delivery, scheduling, hosting, backups and monitoring must be verified before public selling.

## Verification

```powershell
pnpm check
pnpm test
pnpm test:db
pnpm build
pnpm audit --prod
```

`test:db` requires Docker. It creates a fresh, isolated PostgreSQL container with no external network or host port, applies migrations and tests catalogue imports, access controls, money, stock, concurrency, requests and fulfilment. It removes only its own temporary container.

After building, stop the development server and start the production server on the configured origin:

```powershell
pnpm --filter web start --hostname 127.0.0.1 --port 3100
node scripts/check-store-http.mjs http://127.0.0.1:3100
node scripts/check-merchant-http.mjs http://127.0.0.1:3100
```

These HTTP checks expect local configuration with ordering closed. They verify responses and access boundaries; authenticated browser interaction and real-provider acceptance require separate checks.
