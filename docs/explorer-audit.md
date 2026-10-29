# PDC Explorer audit

Audit date: 2026-10-29. Scope is this repository (`pdc-explorer`) only. Findings below are from reading the running code paths. Items marked fixed were changed in this branch. Items marked open were left alone because the safe fix is not local, needs a schema migration, or is only a hypothesis.

## Architecture

The explorer is one Node process. Express serves `/api/*`, Socket.IO, and the Next.js page handler. PostgreSQL is the index. A PDC daemon (`pdcd`) is the chain source of truth. Optional HTTP dependencies are Trade (oracle USD book), an asset whitelist, Matrix, and CoinGecko for fiat FX. PDC spot prices must not come from MEXC.

```text
browser
  |  Next.js pages (src/pages) + Fetch (/api) + Socket.IO
  v
Express (server/server.ts)  --JSON-RPC-->  pdcd  API/json_rpc
  |                         --HTTPS------>  Trade (oracle prices/usd) / CoinGecko FX / whitelist / Matrix
  v
PostgreSQL
  blocks, transactions, charts, out_info, alt_blocks, aliases, assets, pool, pdc_prices
```

Sync loops, all inside the same process:

| Loop | Source | Store | Interval |
| --- | --- | --- | --- |
| `getInfoTimer` → `syncBlocks` | `get_blocks_details` + `get_tx_details` | `blocks`, `transactions`, `charts`, `out_info` | about 10s, 100 blocks per pass |
| `syncAltBlocks` | `get_alt_blocks_details` | `alt_blocks` (full replace) | when daemon alt count changes |
| `syncPool` | pool tx list + details | `pool` | when pool size changes |
| `SyncService.syncAliases` | alias RPC | `aliases` (full replace) | 20s |
| asset loop | `get_assets_list` | `assets` | 10s |
| `syncLatestPrice` | Trade/oracle `GET …/prices/usd` | `pdc_prices` | boot + cron every 4h |
| spot price in memory | Trade/oracle USD book (PDC, ETH) | `state.priceData` | same 10s loop |

`NET_MODE` and `src/config/network.ts` describe mainnet constants (12 decimals, 60s target, `Px` addresses). `API` is the daemon origin; the server appends `/json_rpc`. Chain reads that miss Postgres fall back to that RPC. There is no separate worker and no test runner in the previous tree.

Trust boundary: the browser and any caller of `/api` are untrusted. The daemon, Postgres, and configured upstream URLs are trusted operators. `POST /api/find_outs_in_recent_blocks` forwards a view key to the daemon. It must not be placed in a query string (already rejected on GET).

## Fixed in this branch

| Bug | Why it is safe |
| --- | --- |
| `GET /api/get_alt_blocks_details/:offset/:count` computed rows and returned them from the handler without `res.json`, so the HTTP request never completed. A second registration of the same path was unreachable. | The UI already requires a JSON array (`alt-blocks/index.tsx`). The handler now sends that array and rejects a non-positive count. The dead daemon-shaped duplicates were removed. |
| `GET /api/get_tx_details/:tx_hash` daemon fallback spread the whole block row over the transaction. Block `tx_id` and numeric `id` replaced the transaction hash. | The database path already exposes `block_hash` and `block_timestamp`. The fallback now does the same and leaves transaction fields intact. |
| Key-image search returned the integer primary key and the UI opened `/transaction/<key image>`. | The API returns the 64-hex `tx_id`. The shell search and the top search open `/transaction/<tx_id>` only when that hash is present. |
| `GET /api/get_total_coins` ran `Number()` then `parseInt` on atomic supply. Past `2^53` (about 9000 PDC at 12 decimals) the decimal string was wrong. | Digits are taken from the raw JSON body and divided with `BigNumber`. The response is still a two-decimal string. |
| In-memory spot and `pdc_prices` sync called MEXC (`PRICE_SYMBOL` / klines). | Spot PDC/ETH and latest DB snapshots now use Trade/oracle `GET …/prices/usd` only. MEXC helpers and historical klines backfill are removed. |
| Confirmed-transactions chart treated an already-converted unix second offset as milliseconds (`new Date(seconds)`), so the SQL window collapsed near 1970. | The lower bound is the UTC day containing that second, matching the `% 86400` buckets. |
| Alt-block `type` is an integer. The UI compared it to the string `"0"` / `"1"`, so list rows were all PoW and the detail page was all PoS. Both timestamp columns showed `timestamp`. Hash links pointed at `/alt-blocks/:hash`, which has no page. Miner text is stored as `miner_txt_info`. | Type checks use `String(type)`. The second column uses `actual_timestamp` when present. Links go to `/block/:hash?alt=1`, and that page loads alt-block details. Miner text reads either column name. |
| Every info tick loaded every non-zero fee into Node to sum burned PDC. | One SQL `SUM` on the transactions model. Non-numeric fee text contributes 0 instead of poisoning the sum. |
| `exceptionHandler` called `next()` with no error, so a failed `/api` call could fall through to another route or to an HTML page. | Failures before a response become HTTP 500 JSON. The error text is not copied into the body. |
| `blocks_limit` on the view-key RPC was taken from the client with no cap. Block and pool list counts were not capped. Alias search pasted `%` and `_` into `LIKE`. Matrix `page` and `items` were interpolated raw. `PGDATABASE` was interpolated into `CREATE DATABASE`. Log month used `Date#getMonth()` (0–11). Socket `get_visibility_info` emitted a Promise. A second copy of `GET /api/get_asset_details/:asset_id` never ran. | Limit defaults to 5 and caps at 100. List counts cap at `MAX_DAEMON_REQUEST_COUNT`. `LIKE` wildcards are escaped (PostgreSQL default escape is `\`). Query values are encoded. The database name must match `^[A-Za-z_][A-Za-z0-9_]*$`. Month is `getMonth() + 1`. The socket payload is awaited. The dead asset route was removed. |

## Open (not changed)

| Priority | Item | Why it was left |
| --- | --- | --- |
| High | Alt-block sync writes `transactions_details` and `cumulative_diff_precise`, but the model columns are `transaction_details` (varchar 255) and no precise-difficulty column. Sequelize drops the extra fields, so alt-block transaction lists stay empty. | Writing the JSON into varchar(255) would fail the sync transaction. Widening the column needs a migration and a deploy check against existing databases. |
| High | `syncBlocks` calls itself after each 100-block batch, so a long catch-up holds a deep stack. On a prev-hash mismatch it deletes block rows above `height - 100` and does not delete matching `transactions`, `charts`, or `out_info`. | Changing reorg deletion can drop indexed history. This needs a loop plus a tested delete of dependent rows. |
| Medium | Hash-rate chart series `d120`, `h100`, and `h400` all use `difficulty / 60`. | Likely a port of three Zano windows, but the PDC target is a single 60s window. Collapsing them without a daemon reference would invent a hashrate. |
| Medium | `express-rate-limit` on the view-key route is 1 request / 5s and `trust proxy` is unset. Behind one reverse proxy every visitor shares that bucket. | Turning the limit up, or trusting `X-Forwarded-For`, depends on the deploy. Left as an operator setting. |
| Medium | `GET /api/get_info/:flags` forwards `flags` to `getinfo`. | Public daemon proxy. Restricting flags can hide fields the UI already reads from `get_info` (no flags). Not changed. |
| Low | `heapdump` is a dependency and is not imported. | No runtime effect until something `require`s it. Removing it is a lockfile change, not a behavior fix. |
| Low | `Access-Control-Allow-Origin: *` on Express. | Public read API. Socket.IO already pins `FRONTEND_API`. |
| Info | Stats "Transactions" is `height + tx_count`. | Sample `getinfo` in `src/utils/apiExamples.ts` has `tx_count` (7391) lower than `height` (18435), which matches coinbase transactions being omitted from `tx_count`. Not treated as a bug. |
| Info | Oracle book has no long historical kline series. | `syncHistoricalPrice` is a no-op; `syncLatestPrice` stores oracle PDC every ~4h. |

## How to verify

Unit tests do not need Postgres or `pdcd`:

```bash
npm test
```

Expected: `src/utils/pure.test.ts` and `server/exceptionHandler.test.ts` pass. They cover supply past `2^53`, oracle book price helpers, the UTC chart bound, integer block types, the view-key limit cap, key-image hash vs row id, and the JSON 500 handler.

With Postgres, a daemon, and `npm run dev`:

1. `GET /api/get_alt_blocks_details/0/10` returns a JSON array (possibly empty) and closes. It must not hang.
2. Open an alt-block hash. The address bar is `/block/<hash>?alt=1`. PoW rows (`type` 1) show PoW. The two timestamp columns differ when `actual_timestamp` differs.
3. `GET /api/get_tx_details/<tx hash>` for a transaction that is not yet in `transactions` still returns that transaction hash in `id` or `tx_id`, and `block_hash` separately when the block row exists.
4. Search a key image that exists in `transactions.ins`. The next page is `/transaction/<64 hex tx id>`, not the key image and not a small integer.
5. `GET /api/get_total_coins` is a decimal string. For atomic `1000000000000` it is `1.00`.
6. `GET /api/pdc_market` and the asset price loop use Trade/oracle `prices/usd` (no MEXC host).
7. `GET /api/get_chart/ConfirmTransactPerDay/<now minus 7 days in ms>` does not return buckets from 1970.
8. `POST /api/find_outs_in_recent_blocks` with `limit: 100000` is forwarded with `blocks_limit` 100. `GET` on that path stays 405.

This branch did not start the Next.js UI, Postgres, or a daemon, so the list above was not exercised against a live node.
