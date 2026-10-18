# quanarch-node

The Node.js · TypeScript stack of [Quanarch](https://quanarch.org): the templates
`qu` uses for `--lang node-ts`.

> Not released yet. Until its first version, try it from a clone:
> `QU_STACK_DIR=path/to/quanarch-node qu new project …` with qu 0.3.1 or later.

## How Quanarch works in Node.js

- The **quanar** is one server process. It holds no business logic: an `api-manager`
  listens for the quans, a `db-manager` stores for them, and a loader brings them in.
- A **quan** is business logic built into one file. It serves nothing itself:
  `api.get('/notes', handler)` asks the quanar to listen to `GET /notes`, and
  `db.create('notes', row)` asks it to store a row. It cannot run on its own.
- The **qua** is the contract: `api` and `db`, with general methods only, and `init()`
  where the quanar plugs its core in. It knows no tables, no users, no stock.

Each quan runs in its own Node process, with the permission model on, an empty
environment and a memory limit; it only gets the quas plugged into it. A quan's
`npm run watch` serves its file and announces every new build on `/events`; the
quanar follows that stream, loads the quan when it opens, reloads it on a new
build and unmounts it the moment it closes.

## Templates

| Template | What it holds |
| --- | --- |
| `templates/project` | The project root: `conf.qu`, a README and `packages/README.md`. |
| `templates/qua` | The contract: `QuanarCore` with `api` and `db`, `init()` and the thin calls quans make. |
| `templates/quanar` | The server: `api-manager`, `db-manager` (in memory), HTTP server, loader, the quan host and the event stream. Also renders a **qmock**, on port 3001. |
| `templates/quan` | A quan that listens to `GET` and `POST /<name>` and stores rows in the `<name>` table, with handlers, a service and constants. |

How a quan or a qua added later is taken in by the quanar is declared in
`stack.qu`, under `on quan` and `on qua`.

## License

Quanarch was created by [Can Berk Coşar](https://berkcosar.com) and is developed at
[Relteco](https://relteco.com).

Licensed under the [Apache License, Version 2.0](LICENSE). See [NOTICE](NOTICE).
