/**
 * PDC mainnet constants.
 * Verified against PrivacyDataCoin-Project/PDC:
 * - src/currency_core/currency_config.h
 * - src/currency_core/currency_basic.h (native asset id == crypto::c_point_H)
 *
 * DIFFICULTY_TOTAL_TARGET = (DIFFICULTY_POS_TARGET + DIFFICULTY_POW_TARGET) / 4
 *                         = (120 + 120) / 4 = 60 seconds.
 * CURRENCY_BLOCKS_PER_DAY = 86400 / 60 = 1440.
 */
export const NETWORK = {
    name: "PDC",
    ticker: "PDC",
    decimalPoint: 12,
    coin: "1000000000000",
    blockReward: "1",
    premine: "0",
    targetSeconds: 60,
    blocksPerDay: 1440,
    p2pPort: 19121,
    rpcPort: 19211,
    stratumPort: 19777,
    genesis:
        "df35cba557c857756f20612ce3c9d2aa315d0ae8fc2aaffe6c5c59d37e00b10a",
    addressPrefix: "Px",
    integratedAddressPrefix: "iP",
    auditableAddressPrefix: "aPx",
    auditableIntegratedAddressPrefix: "aiPX",
    release: "v2.1.0",
    website: "https://privacydatacoin.com/",
    tradeWebsite: "https://trade.privacydatacoin.com/",
    arqmaWebsite: "https://arqma.com",
    uiRepo: "https://github.com/PrivacyDataCoin-Project/PDC/releases",
    siteRepo: "https://github.com/PrivacyDataCoin-Project/PrivacyDataCoin-Project.github.io",
} as const;

/** Native coin asset id. Same bytes as crypto::c_point_H in currency_basic.h. */
export const PDC_ASSET_ID =
    "d6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a";

/** Wrapped Bitcoin (BTCX) asset id used by the Trade bridge peg. */
export const BTCX_ASSET_ID =
    "c2bf0410873b49ec7e7dd19d62bca9625d80cd3123670a67b48d997d3127426d";

/** Wrapped Arqma (ARQX) asset id used by the Trade CN wrap bridge. */
export const ARQX_ASSET_ID =
    "d59ca1b363d5f44e0f087d9549b734815fbc2a6ab49ef0a877ccd910b1a1b9c3";

/** Public Arqma bridge address for the ARQX wrap (Trade live watcher). */
export const ARQX_DEPOSIT_ADDRESS =
    "ar3LY7oysJU38hASBtQ9iDR1A8dPMGHTVJvjK68sfdmDJo4VzYXGM8GS9s86MgPYrPMEaLCXJhTkbTX9N196KJmk2ZfrYVfWF";
