# ShopLedger

## Stack

- Node.js server using Express 4 and `body-parser`.
- Browser UI is plain HTML, CSS, and JavaScript under `public/`.
- Runtime records are stored in `data/db.json` through `lib/store.js`.
- Configuration for the port, shop, tax, inventory, and coupons is in `config.js`.

## Module map

- `server.js` creates the Express app, serves `public/`, mounts the API routers, and serves printable invoices.
- `routes/products.js` serves products and coupons; `routes/orders.js` handles order listing, creation, and cancellation; `routes/customers.js` handles customer accounts and settlements; `routes/reports.js` handles dashboard/reconciliation reports, pricing preview, and admin export.
- `lib/orders.js`, `lib/inventory.js`, `lib/pricing.js`, `lib/tax.js`, and `lib/coupons.js` implement order, stock, pricing, tax, and coupon logic.
- `lib/ledger.js` implements khata balances and settlements; `lib/reports.js` builds dashboard and reconciliation data; `lib/invoice.js` computes and renders printable invoices; `lib/dates.js` handles date formatting; `lib/store.js` reads and writes `data/db.json` and appends audit entries.
- `public/index.html`, `public/js/app.js`, and `public/css/style.css` make up the browser UI.

## Commands

- `npm start` — starts the app with `node server.js`.
- `npm test` — currently a placeholder that exits with an error because no test suite is configured.

## Change rules

- Write characterization tests before changing behaviour.
- Change only the module the ticket is about.
- Tests never touch `data/db.json`.
- Add no dependencies.
