import styles from "@/styles/Assets.module.scss";
import { useState, useEffect, useRef, memo, useCallback } from "react";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import Table from "@/components/default/Table/Table";
import Fetch from "@/utils/methods";
import AliasText from "@/components/default/AliasText/AliasText";
import JSONPopup from "@/components/default/JSONPopup/JSONPopup";
import Switch from "@/components/UI/Switch/Switch";
import { nanoid } from "nanoid";
import Button from "@/components/UI/Button/Button";
import CopyButton from "@/components/UI/CopyButton/CopyButton";
import CommonStatsPanel from "@/components/UI/CommonStatsPanel/CommonStatsPanel";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { GetServerSideProps } from "next";
import { AssetsPageProps, getAssets } from "@/utils/ssr";
import Utils from "@/utils/utils";
import { PDC_ASSET_ID } from "@/utils/constants";
import Link from "next/link";


export const DEFAULT_ASSETS_ON_PAGE = "20";

const AssetPopupBottom = memo(({ assetId }: { assetId?: string }) => {

    const [clicked, setClicked] = useState(false);

    const assetLink = assetId !== undefined 
        ? `${window.location.origin}/assets?asset_id=${encodeURIComponent(assetId)}` 
        : undefined;

    function copy() {
        if (!assetLink) return;
        if (clicked) return;

        navigator.clipboard.writeText(assetLink);
        setClicked(true);

        setTimeout(() => {
            setClicked(false);
        }, 2e3);
    }

    return (
        assetLink ? (
            <div className={styles["asset_popup__bottom"]}>
                <Button onClick={copy}>{clicked ? 'Copied' : 'Copy asset link'}</Button>
            </div>
        ) : (
            <div className={styles["asset_popup__not_found"]}>
                <h3>
                    Asset not found or does not exist. For newly created assets, please allow one minute to appear in the explorer
                </h3>
            </div>
        )
    )
});

function Assets(props: AssetsPageProps) {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [isLoading, setLoading] = useState(false);

    const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);

    const [burgerOpened, setBurgerOpened] = useState(false);

    const [assets, setAssets] = useState<any[]>(props.assets);

    const [assetJson, setAssetJson] = useState<Record<string, any>>({});

    const [popupState, setPopupState] = useState(false);
    const [notFountPopupState, setNotFountPopupState] = useState(false);

    const [itemsOnPage, setItemsOnPage] = useState(DEFAULT_ASSETS_ON_PAGE);
    const [page, setPage] = useState("1");

    const isWhitelist = selectedTitleIdx === 0;

    const [inputState, setInputState] = useState("");
    const [initFetched, setInitFetched] = useState(false);

    const [assetsStats, setAssetStats] = useState<{
        assetsAmount?: number;
        whitelistedAssetsAmount?: number;
    }>({
        assetsAmount: props.assetsAmount,
        whitelistedAssetsAmount: props.whitelistedAssetsAmount
    });
    
    const fetchIdRef = useRef<string>(nanoid());

    const fetchPdcPrice = useCallback(async (assets?: any[]) => {
        const pdcPrice = await Utils.getPdcPrice();
        setAssets(prev => {
            const newAssets = [...(assets || prev)];
            const pdcAsset = newAssets.find(e => e.asset_id === PDC_ASSET_ID);
            if (pdcAsset) {
                pdcAsset.price = pdcPrice;
            }
            return newAssets;
        });
    }, []);

    useEffect(() => {
        async function fetchAssetsStats() {
            setLoading(true);
            try {
                const result = await Fetch.getAssetsCount();
                const assetsAmount = result?.assetsAmount;
                const whitelistedAssetsAmount = result?.whitelistedAssetsAmount;
                setAssetStats({
                    assetsAmount:
                        typeof assetsAmount === "number"
                            ? assetsAmount
                            : undefined,
                    whitelistedAssetsAmount:
                        typeof whitelistedAssetsAmount === "number"
                            ? whitelistedAssetsAmount
                            : undefined
                })
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        fetchAssetsStats();
    }, []);

    useEffect(() => {
        async function fetchParamAsset() {
            const assetId = decodeURIComponent(
                searchParams.get('asset_id') || ""
            );


            if (assetId) {
                const response = await Fetch.getAssetDetails(assetId);
                setInitFetched(true);

                if (response.success && response.asset) {
                    setPopupState(true);
                    setAssetJson(response.asset);
                } else {
                    setNotFountPopupState(true);
                }
            } else {
                setInitFetched(true);
            }
        }

        if (!initFetched) {
            fetchParamAsset();
        }
        
    }, [searchParams, initFetched]);

    useEffect(() => {
        fetchPdcPrice();

        const intervalId = setInterval(() => {
            fetchPdcPrice();
        }, 10e3);

        return () => {
            clearInterval(intervalId);
        }
    }, []);

    useEffect(() => {
        setPage("1");
    }, [isWhitelist, inputState]);

    useEffect(() => {
        async function fetchAssets() {
            setLoading(true)

            const itemsOnPageInt = parseInt(itemsOnPage, 10) || 0;
            const pageInt = parseInt(page, 10) || 0;

            const offset = (pageInt - 1) * itemsOnPageInt;

            const newFetchId = nanoid();
            fetchIdRef.current = newFetchId;

            let result;
            try {
                result = isWhitelist
                    ? await Fetch.getWhitelistedAssets(offset, itemsOnPageInt, inputState)
                    : await Fetch.getAssets(offset, itemsOnPageInt, inputState);
            } catch (error) {
                console.error(error);
                if (newFetchId === fetchIdRef.current) setLoading(false);
                return;
            }

            if (newFetchId !== fetchIdRef.current) return;
            if (!(result instanceof Array)) {
                setLoading(false);
                return;
            }

            try {
                const assetsIds = result.map((asset: any) => asset.asset_id);
                const assetsPriceRatesResponse = await Fetch.getAssetsPriceRates(assetsIds);
                const assetsPriceRates = assetsPriceRatesResponse?.priceRates;
                const pdcPrice = await Utils.getPdcPrice();

                const resultAssets = result.map((resultAsset: any) => {
                    if (assetsPriceRatesResponse?.success && pdcPrice && Array.isArray(assetsPriceRates)) {
                        const targetAsset = assetsPriceRates.find((asset: any) => asset.asset_id === resultAsset.asset_id);
                        if (!targetAsset) return resultAsset;
                        return {
                            ...resultAsset,
                            price: parseFloat((targetAsset.rate * pdcPrice).toFixed(6)).toString(),
                        };
                    }
                    return resultAsset;
                });

                if (newFetchId !== fetchIdRef.current) return;
                fetchPdcPrice(resultAssets);
            } catch (error) {
                console.error(error);
            } finally {
                if (newFetchId === fetchIdRef.current) setLoading(false);
            }
        }
        
        fetchAssets();
    }, [itemsOnPage, page, isWhitelist, inputState]);

    function onAssetClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>, asset: Object) {
        event.preventDefault();
        setAssetJson(asset);
        setPopupState(true);
    }

    const tableHeaders = [ "NAME", "TICKER", "ASSET ID", "PRICE", "SOURCE" ];    
    
    const tableElements = assets.map(e => [
        e?.full_name || "",
        e?.ticker || "",
        <div className={styles["assets__table_asset-id"]}>
            <CopyButton text={e?.asset_id || ""} />
            <AliasText href="/" onClick={(event) => onAssetClick(event, e)}>
                {e?.asset_id || ""}
            </AliasText>
            
        </div>,
        e?.price ? `${e?.price}$` : "No data",
        e?.asset_id === PDC_ASSET_ID ? 
        <Link href="https://privacydatacoin.com/" target="_blank">Website</Link>
        : 
        "—"
    ]);

    const statsPanelData = [
        { key: "Total Assets", value: assetsStats.assetsAmount?.toString() || "..." },
        { key: "Whitelisted", value: assetsStats.whitelistedAssetsAmount?.toString() || "..." }
    ];

    return (
        <div className={styles["assets"]}>
            <Header 
                page="Assets" 
                burgerOpened={burgerOpened} 
                setBurgerOpened={setBurgerOpened} 
            />
            <InfoTopPanel 
                burgerOpened={burgerOpened} 
                title="Assets"
                contentNotHiding
                inputDefaultClosed
                inputParams={{
                    placeholder: "ticker / name / asset id",
                    state: inputState,
                    setState: setInputState
                }}
                content={
                    <Switch
                        titles={["Whitelisted", "All Assets"]}
                        selectedTitleIdx={selectedTitleIdx}
                        setSelectedTitleIdx={setSelectedTitleIdx}
                    />
                }
            />
            <CommonStatsPanel pairs={statsPanelData} className={styles["assets__stats"]} />
            <div className={styles["assets__table"]}>
                <Table 
                    headers={tableHeaders}
                    elements={tableElements}
                    columnsWidth={[ 15, 10, 65, 10 ]}
                    pagination
                    hidePaginationBlock
                    itemsOnPage={itemsOnPage}
                    setItemsOnPage={setItemsOnPage}
                    page={page}
                    setPage={setPage}
                    isLoading={isLoading}
                />
            </div>
            {
                JSONPopup({
                    popupState: popupState || notFountPopupState,
                    setPopupState: setPopupState,
                    json: assetJson,
                    hideJson: notFountPopupState,
                    bottomContent: (
                        <AssetPopupBottom
                            assetId={
                                !notFountPopupState ? (assetJson?.asset_id || "") : undefined
                            }
                        />
                    ),
                    onClose: () => {
                        if (searchParams.get('asset_id')) {
                            const removeQueryParam = (param: string) => {
                                const updatedQuery = router.query;
                                delete updatedQuery[param];
                            
                                router.push({ query: updatedQuery }, undefined, { shallow: true });
                            }

                            removeQueryParam('asset_id');
                        }
                        setNotFountPopupState(false);
                    }
                })
            }
        </div>
    )
}


const getServerSideProps: GetServerSideProps = getAssets;
export { getServerSideProps };

export default Assets;