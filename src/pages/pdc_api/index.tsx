import { useState } from "react";
import Header from "@/components/default/Header/Header";
import styles from "@/styles/API.module.scss";
import APIItemValue from "@/interfaces/common/APIItemValue";
import examples from "@/utils/apiExamples";
import { nanoid } from "nanoid";
import JsonViewStyled from "@/components/UI/JsonViewStyled/JsonViewStyled";

interface APIEndpointItemProps {
    title: string, 
    method: { 
        text: string, 
        link?: string 
    }, 
    example: string,
    json?: Object
}

function API() {
    const howToUseValues = [
        { key: "API ENDPOINT", value: { text: "/api" } },
        { key: "URL Request Format", value: { text: "/api/{method}/{param1}/{param2}" } },
    ];

    // method.link is currently not in use
    const endpoints: APIEndpointItemProps[] = [
        { 
            title: "Request current coin stats", 
            method: { text: "get_info", link: "https://github.com/PrivacyDataCoin-Project/PDC" }, 
            example: "/api/get_info/4294967295", 
            json: examples.get_info
        },
        { 
            title: "Request current price for asset", 
            method: { text: "price" }, 
            example: "/api/price?asset_id={:asset_id}", 
            json: examples.price
        },
        { 
            title: "Request current total coins", 
            method: { text: "get_total_coins"}, 
            example: "/api/get_total_coins",
            json: examples.get_total_coins
        },
        { 
            title: "Request asset's current supply", 
            method: { text: "get_asset_supply"}, 
            example: "/api/get_asset_supply?asset_id={:asset_id}",
            json: examples.get_total_coins
        },
        { 
            title: "Request blocks (offset and count)", 
            method: { text: "get_blocks_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" }, 
            example: "/api/get_blocks_details/{:offset}/{:count}",
            json: examples.get_blocks_details
        },
        { 
            title: "Request a given block by hash", 
            method: { text: "get_main_block_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" }, 
            example: "/api/get_main_block_details/{:hash}",
            json: examples.get_main_block_details
        },
        { 
            title: "Request Alt-blocks (offset and count)", 
            method: { text: "get_alt_blocks_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" }, 
            example: "/api/get_alt_blocks_details/{:offset}/{:count}",
            json: examples.get_alt_blocks_details_offset
        },
        { 
            title: "Request a given Alt-block by hash", 
            method: { text: "get_alt_block_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" }, 
            example: "/api/get_alt_block_details/{:hash}",
            json: examples.get_alt_blocks_details_offset
        },
        { 
            title: "Request transaction from the pool", 
            method: { text: "get_pool_txs_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" }, 
            example: "/api/get_pool_txs_details",
            json: examples.get_pool_txs_details
        },
        {
            title: "Request brief information transactions from the pool",
            method: { text: "get_pool_txs_brief_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" },
            example: "/api/get_pool_txs_brief_details",
            json: examples.get_pool_txs_brief_details
        },
        {
            title: "Request IDs for all txs from the pool",
            method: { text: "get_all_pool_tx_list", link: "https://github.com/PrivacyDataCoin-Project/PDC" },
            example: "/api/get_all_pool_tx_list",
            json: examples.get_all_pool_tx_list
        },
        {
            title: "Request a given transaction by hash",
            method: { text: "get_tx_details", link: "https://github.com/PrivacyDataCoin-Project/PDC" },
            example: "/api/get_tx_details/{:tx_hash}",
            json: examples.get_tx_details
        },
        {
            title: "Request outs of recent blocks",
            method: { text: "find_outs_in_recent_blocks", link: "https://github.com/PrivacyDataCoin-Project/PDC" },
            example: "/api/find_outs_in_recent_blocks?address={address}&viewkey={viewkey}&limit={limit}",
            json: examples.find_outs_in_recent_blocks
        }
    ]

    const [burgerOpened, setBurgerOpened] = useState(false);

    function APIItem(props: { title: string, values?: APIItemValue[], json?: Object }) {
        const { title, values, json } = props;

        return (
            <div className={styles["api__item"]}>
                <div className={styles["api__item__title"]}>
                    <h3>{title}</h3>
                </div>
                <div className={styles["api__item__units"]}>
                    {
                        values?.map(e => (
                            <div key={e.key} className={styles["api__item__unit"]}>
                                <div>
                                    <p>{e.key}</p>
                                </div>
                                <div>
                                    <p>{e.value.text}</p> 
                                </div>
                            </div>
                        ))
                    }
                </div>
                {json &&
                    <div className={styles["api__item__json"]}>
                        <p>JSON Response</p>
                        <JsonViewStyled 
                            data={json} 
                            shouldExpandNode={() => false}
                        />
                    </div>
                }
            </div>
        )
    }

    function APIEndpointItem(props: APIEndpointItemProps) {
        const { title, method, example, json } = props;

        const ItemValues: APIItemValue[] = [
            { key: "Method:", value: method },
            { key: "Example:", value: { text: example } }
        ] 

        return (
            <APIItem title={title} values={ItemValues} json={json} />
        )
    }

    return (
        <div className={styles["api"]}>
            <Header 
                page="API" 
                burgerOpened={burgerOpened} 
                setBurgerOpened={setBurgerOpened} 
            />
            <div className={styles.head}>
                <h2>API</h2>
            </div>
            <div className={styles["api__items"]}>
                <APIItem title="How to use" values={howToUseValues} />
                {
                    endpoints.map(e => (
                        <APIEndpointItem key={nanoid(16)} {...e} />
                    ))
                }
            </div>
        </div>
    )
}

export default API;