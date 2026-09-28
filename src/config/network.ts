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
    protocolRepo: "https://github.com/PrivacyDataCoin-Project/PDC",
    uiRepo: "https://github.com/PrivacyDataCoin-Project/pdc_ui",
    siteRepo: "https://github.com/PrivacyDataCoin-Project/PrivacyDataCoin-Project.github.io",
} as const;

/** Native coin asset id. Same bytes as crypto::c_point_H in currency_basic.h. */
export const PDC_ASSET_ID =
    "d6329b5b1f7c0805b5c345f4957554002a2f557845f64d7645dae0e051a6498a";
