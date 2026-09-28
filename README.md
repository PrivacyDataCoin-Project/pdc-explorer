# PDC Block Explorer

Block explorer for [Privacy Data Coin (PDC)](https://privacydatacoin.com/). It is adapted from [hyle-team/zano-explorer-zarcanum](https://github.com/hyle-team/zano-explorer-zarcanum) and keeps that project's Next.js, Express, and PostgreSQL layout.

The upstream repository does not include a license file. If you redistribute this code, keep any license terms that apply to the original project and keep this attribution.

Protocol: [PrivacyDataCoin-Project/PDC](https://github.com/PrivacyDataCoin-Project/PDC) (default branch `master`).

Wallet UI: [PrivacyDataCoin-Project/pdc_ui](https://github.com/PrivacyDataCoin-Project/pdc_ui) (default branch `master`). Logos in `public/` are the official GUI wordmark and padlock from that UI.

Current protocol release: **v2.1.0**.

## Network

Values below match `src/currency_core/currency_config.h` and `src/currency_core/currency_basic.h` in the protocol repository.

| Setting | Value |
| --- | --- |
| Ticker | PDC |
| Decimals | 12 (`COIN` = 10^12) |
| Block reward | 1 PDC |
| Premine | 0 |
| Block target | 60 seconds (`DIFFICULTY_TOTAL_TARGET`) |
| P2P port | 19121 |
| RPC port | 19211 |
| Stratum port | 19777 |
| Address prefix | `Px` (integrated `iP`, auditable `aPx`, auditable integrated `aiPX`) |
| Genesis | `df35cba557c857756f20612ce3c9d2aa315d0ae8fc2aaffe6c5c59d37e00b10a` |

The native asset id is the Zarcanum point `crypto::c_point_H`:

`d6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a`

## Requirements

- Node.js 20 or newer
- PostgreSQL

## Clone and configure

```bash
git clone https://github.com/PrivacyDataCoin-Project/pdc-explorer.git
cd pdc-explorer
cp .env.example .env
npm install
```

Edit `.env` if the daemon or database is not on localhost. `API` is the daemon base URL. The explorer appends `/json_rpc`. The default mainnet RPC port is **19211**.

Start a PDC daemon (`pdcd`) so it listens on that RPC port, and create a PostgreSQL role that matches `PGUSER` / `PGPASSWORD`. The explorer creates `PGDATABASE` when the role can create databases.

## Run

Development (API server and Next.js dev UI):

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Open `http://127.0.0.1:3000`.

`npm run client` starts only the Next.js dev server. The explorer API is the Express process started by `npm run dev` or `npm start`.

`NET_MODE=TEST` switches the UI into testnet mode. Point `API` at the testnet daemon RPC (`19111` in `currency_config.h`). Set `NEXT_PUBLIC_MAINNET_EXPLORER` and `NEXT_PUBLIC_TESTNET_EXPLORER` when both explorers are deployed; the header shows the switch only then.

Price history is skipped unless `PRICE_SYMBOL` is a real spot market (for example `PDCUSDT`). Asset whitelist, trade, and Matrix URLs are optional and are not called when empty.
