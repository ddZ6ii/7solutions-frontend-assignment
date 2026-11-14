# Departments API

HTTP API that fetches users from [dummyjson](https://dummyjson.com/users) and groups them by department.

Part 2 (optional) of the [7Solutions frontend assignment](https://github.com/7-solutions/frontend-assignment#2-create-data-from-api-optional). See the [workspace README](../../README.md) for setup.

## Endpoints

**Live:** <!-- TODO: add the API's production URL after deployment -->

| Method | Path           | Response                                                                   |
| ------ | -------------- | -------------------------------------------------------------------------- |
| `GET`  | `/departments` | `200`: users grouped by department (see the sample below)                  |
| `GET`  | `/health`      | `200`: `{ "status": "ok" }`                                                |
| any    | other paths    | `404`: `{ "error": "Not found" }`                                          |
| —      | upstream fails | `502` or `504`: `{ "error": "<generic message>" }` (see [Errors](#errors)) |

### Sample response

One department from the real data:

```json
{
  "Business Development": {
    "male": 0,
    "female": 7,
    "ageRange": "27-44",
    "hair": { "Black": 1, "Red": 1, "Blonde": 3, "Green": 2 },
    "addressUser": {
      "LillianSimmons": "47571",
      "HazelGardner": "35181",
      "NoraMills": "51983",
      "SophiaJones": "24752",
      "ZoeBennett": "50908",
      "PaisleyBell": "49147",
      "SamanthaMartinez": "53772"
    }
  }
}
```

- `male` and `female` are always present, even when a count is 0. Other gender values are not counted, but those users still appear in `ageRange`, `hair` and `addressUser`.
- `ageRange` is `"min-max"`, without zero-padding (`"5-46"`, not `"05-46"`).
- `addressUser` keys are `firstName + lastName`, with no space.

## Run

| From the repo root | Inside `apps/api` | Description                                                        |
| ------------------ | ----------------- | ------------------------------------------------------------------ |
| `vp run dev:api`   | `vp run dev`      | Start the API on http://localhost:3000, restarting on file changes |
| `vp run test:api`  | —                 | Run the API unit tests                                             |
| `vp run test:live` | —                 | Run the contract tests against the real dummyjson                  |
| `vp run bench`     | —                 | Run the benchmark and print the timings table                      |

The port defaults to 3000; set `PORT` to use another one, e.g. `PORT=3001 vp run dev:api`.

## How it works

```
GET /departments
  │
  ├─▶ Vercel CDN ── fresh copy? ──▶ answers directly (the function doesn't run)
  │
  └─▶ Hono app (app.ts)
        └─▶ getDepartments()         in-memory cache, 60 s
              └─▶ fetchUsers()        dummyjson, validated with Zod Mini
              └─▶ groupByDepartment() single pass over the users
```

```
src/
├── index.ts         Vercel entry: export default createApp(...)
├── server.ts        local entry: serves the same app with @hono/node-server
├── app.ts           routes, headers, error handling
├── departments/     what the API computes: grouping, formatting, cached loader
├── dummyjson/       where the data comes from: HTTP client and schema
├── lib/             generic tools: cache, HTTP errors
└── test/            test setup and fixtures
```

Dependencies point one way: `app → departments → dummyjson → lib`.

## Design decisions

- **Hono rather than Express.** Hono is written in TypeScript, uses the web-standard `Request`/`Response`, runs on Vercel without an adapter, and `app.request()` lets tests call routes without starting a server.
- **Validate the upstream data with Zod Mini.** dummyjson is a third-party API, so its response is validated before use. The rule is _strict on structure, lenient on values_: required fields and types are checked, but `gender` and `hair.color` accept any string. One unexpected value shouldn't make the whole endpoint fail. Zod Mini has the same validation as Zod in a smaller bundle, which helps serverless cold starts.
- **Fetch all users, only the fields needed.** dummyjson returns 30 users by default; `?limit=0` returns all of them, and `select=` (built from the schema's keys) keeps the response small.
- **One pass over the users.** `groupByDepartment` loops over the users once, updating each department's totals, then formats one summary per department: O(n + d) for n users and d departments. See [Performance](#performance).
- **Dictionaries without a prototype.** Department names, hair colors and names come from external data and become object keys. On a plain `{}`, keys such as `__proto__` or `constructor` hit `Object.prototype`; the output objects are created with `Object.create(null)` so every key is stored as a normal property.
- **The app receives its data source.** `createApp({ getDepartments })` takes the loader as a parameter: tests pass a fake, `index.ts` passes the real cached one.
- **Known trade-off.** The `User` type is defined by the dummyjson schema, so the grouping code depends on dummyjson's field layout. With a second data source, the client would convert its data into a type owned by `departments/`.

## Caching

Three mechanisms, each saving something different:

| Mechanism       | Where                      | Saves                                        | Duration                       |
| --------------- | -------------------------- | -------------------------------------------- | ------------------------------ |
| CDN cache       | Vercel's CDN               | running the function at all                  | 5 min fresh, then 10 min stale |
| In-memory cache | one warm function instance | calling dummyjson (and validating, grouping) | 60 s                           |
| ETag / 304      | browser ↔ CDN or function  | re-sending a body the client already has     | until the data changes         |

- **CDN:** `Cache-Control: public, s-maxage=300, stale-while-revalidate=600`. During the stale window the CDN still answers instantly and refreshes its copy in the background.
- **In-memory** (`lib/cached.ts`): concurrent requests on an empty or expired cache share **one** upstream call, so a burst of traffic can't trigger a burst of calls to dummyjson.
- **ETag** (Hono's `etag()` middleware): a client sending a matching `If-None-Match` gets `304 Not Modified` with no body.
- **Failures are never cached.** Error responses are sent with `Cache-Control: no-store`, and the in-memory cache never stores a failed load: the next request tries again.
- Hono's own `cache` middleware isn't used: it relies on the Web Cache API (`globalThis.caches`), which doesn't exist on Node.

## Errors

When dummyjson fails, the client's request was fine, so the API answers like a gateway:

| What happened                                                 | Status | Body                                          |
| ------------------------------------------------------------- | ------ | --------------------------------------------- |
| dummyjson unreachable, non-2xx, invalid JSON or invalid shape | `502`  | `{ "error": "Upstream service unavailable" }` |
| dummyjson didn't answer within 5 s                            | `504`  | `{ "error": "Upstream service timed out" }`   |
| unexpected error in the API's own code                        | `500`  | `{ "error": "Internal server error" }`        |

The response only contains a fixed message. The full error (upstream status, validation issues, original cause) is logged on the server.

## Performance

`vp run bench` compares `groupByDepartment` with a naive version that filters all users once per department, then makes one more pass per statistic: O(d · n). Results on a laptop, with 10,000 generated users:

| Departments | Single pass (mean) | Naive (mean) | Speed-up |
| ----------- | ------------------ | ------------ | -------- |
| 12          | 1.62 ms            | 4.53 ms      | ~2.8×    |
| 1,000       | 1.80 ms            | 84.4 ms      | ~47×     |

The single pass takes about the same time whatever the number of departments; the naive version slows down as departments grow.

**Reading the table** that `vp run bench` prints:

- `mean` is the average time per call: the number to compare.
- `rme` is the margin of error: under ~2% is reliable, above ~5% means re-run.
- `hz` is calls per second (≈ 1000 / mean).
- Absolute times depend on the machine; compare the **ratio** between the two means.

## Testing

68 tests, using Vitest (bundled with Vite+), with 100% coverage. Each layer is tested on its own:

| File                                      | Tests | Covers                                                                                     |
| ----------------------------------------- | ----: | ------------------------------------------------------------------------------------------ |
| `departments/group-by-department.test.ts` |    17 | counts, age range, hair, addresses, several departments, unchanged input, `__proto__` keys |
| `departments/format.test.ts`              |     3 | age range and name formatting                                                              |
| `dummyjson/schema.test.ts`                |    19 | valid and invalid users, extra fields dropped, the response envelope                       |
| `dummyjson/fetch-users.test.ts`           |    10 | exact URL, 502 on non-2xx, invalid JSON, invalid shape or network failure, 504 on timeout  |
| `lib/cached.test.ts`                      |    11 | time limit, shared concurrent loads, failures not cached (fake timers, no real waiting)    |
| `app.test.ts`                             |     8 | status codes, JSON bodies, `Cache-Control`, ETag and 304, generic error messages           |

- **No network in unit tests.** `test/setup.ts` makes any `fetch` that a test didn't mock fail, so a forgotten mock fails loudly instead of calling dummyjson.
- **Contract tests against the real API** (`vp run test:live`, in `*.live.test.ts`) check that dummyjson still matches the schema and that every department summary is consistent. They're excluded from `vp test`, so normal runs stay offline and deterministic.

## Tech stack

- [Hono](https://hono.dev) + [`@hono/node-server`](https://github.com/honojs/node-server) for local development
- [Zod Mini](https://zod.dev/packages/mini)
- [Vite+](https://viteplus.dev): Vitest, Oxlint, Oxfmt

## Possible improvements

- **gRPC** (a bonus in the brief): not done because Vercel Functions only serve request/response HTTP, while a gRPC server needs HTTP/2 streaming on a long-running process. It would need a different host (a container or VM).
- **Serve the expired value when a reload fails** ("stale-if-error"), so a dummyjson outage doesn't return 502 while a recent copy exists.
- **A cache shared across instances** (e.g. Redis or Vercel KV): the in-memory cache is per instance, so each new instance calls dummyjson once.
- **A domain `User` type**, converted from the dummyjson schema in `dummyjson/`, so the grouping code doesn't depend on dummyjson's field layout.
- **Structured logging and rate limiting** for production use.
