# shop · Node.js advanced example

A full-stack Quanarch application: a quanar server, a qua, three quans and a React client.

```
shop/
├── packages/shop-qua/   the qua: types, constants and thin calls; no logic
├── quanar/              the server: managers in src/core, each quan in its own process
├── quans/
│   ├── users/           accounts, roles, sign-in; asks the quanar for tokens
│   ├── products/        catalogue and stock; reserves stock for orders
│   └── orders/          orders; follows products by events
├── artifacts/           built quans, served and announced on /events/<quan>
├── web/                 the React client; it only knows the quanar, under /api
└── scripts/             register (seal the quans), start
```

## Run

Requires Node.js 24 or later.

```sh
npm run setup    # once: installs every part
npm start        # builds the qua and the quans, seals them, builds the quanar, starts everything
```

| Part | Address |
| --- | --- |
| web | http://localhost:5180 |
| quanar | http://localhost:3000 (`/health`, `/quans`) |
| artifacts | http://localhost:4100 |

The first start creates `admin@shop.test` / `admin1234`. Ctrl+C stops all three.

If a port is taken, move the quanar and tell the web where it went:

```sh
PORT=3200 QUANAR_URL=http://localhost:3200 npm start    # ARTIFACTS_PORT moves the artifacts
```

Each part on its own, in three terminals (after `npm run build`):

```sh
node artifacts/server.mjs        # 1 · artifacts
cd quanar && npm start           # 2 · quanar
cd web && npm run dev            # 3 · web
```

Working on a quan: `npm run register -- --open` lists the quans without hashes, then
`cd quans/orders && npm run watch` rebuilds on every change; the quanar takes the new
build in at once. `npm start` seals them again.

| Command | |
| --- | --- |
| `npm run setup` | install every part |
| `npm run build` | build the qua, the quans, seal them, build the quanar |
| `npm start` | `build`, then start artifacts, quanar and web |
| `npm run register` | seal the built quans into `quanar/data/quans.json`; `-- --open` without hashes |
| `npm run typecheck` | type-check every part |

The database is `quanar/data/shop.db`; delete it to start over.

## A quan declares, the quanar does

A quan writes no route, no table and no check by hand. It declares them as data, and the
quanar's managers make them real when it loads the quan:

| The quan declares | in | The quanar's manager |
| --- | --- | --- |
| models: fields, types, unique, index, enum | `src/models` | `schema-manager` creates and migrates the tables |
| permissions | `src/permissions` | `permission-manager` knows them; tokens say who holds them |
| apis: endpoint, method, middlewares, permissions, validation, handler | `src/apis` | `api-manager` opens a router per quan |
| validation rules | `src/validations` | `validation-manager` answers 422 before the quan is reached |
| events it listens to | `src/events` | `event-manager` carries them between quans |

`quan-registry` runs them in that order, then lets the quan start. A request passes the
quanar's middlewares (`authenticate`, `rate-limit`), its permission check and validation,
then the quan's own middlewares (`src/middlewares`), then the handler. Database calls,
password hashing, tokens and events go back to the quanar through the qua.

## An order, by events

`orders` never reads the products' tables. `POST /orders` stores a pending order and emits
`orders.placed`. `products` takes the stock in one transaction and answers
`products.reserved` or `products.rejected`; `orders` follows. Cancelling emits
`orders.cancelled` and `products` gives the stock back.

## Try

- Sign in as a customer and add a product: 403, the quanar checked `products:manage`.
- Send a product with a negative price: 422 with every issue, before the quan runs.
- Order more than the stock: the order is rejected, nothing is taken.
- Change a file in `artifacts/quans` by hand: its hash no longer matches and the quan is unmounted.
- `curl localhost:3000/quans` lists every quan's apis, models, permissions and events.
