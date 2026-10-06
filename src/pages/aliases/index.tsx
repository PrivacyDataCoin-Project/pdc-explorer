import styles from "@/styles/Aliases.module.scss";
import { useState, useEffect, useCallback, useRef } from "react";
import Header from "../../components/default/Header/Header";
import InfoTopPanel from "../../components/default/InfoTopPanel/InfoTopPanel";
import Table from "../../components/default/Table/Table";
import Alias from "../../interfaces/state/Alias";
import Fetch from "../../utils/methods";
import CrownImg from "../../assets/images/UI/crown.svg";
import ConnectionImg from "../../assets/images/UI/connection.svg";
import CommonStatsPanel from "../../components/UI/CommonStatsPanel/CommonStatsPanel";
import { GetServerSideProps } from "next";
import { AliasesPageProps, getAliases } from "@/utils/ssr";
import Switch from "@/components/UI/Switch/Switch";
import { nanoid } from "nanoid";

export const DEFAULT_ITEMS_ON_PAGE = "20";

function Aliases(props: AliasesPageProps) {
    const [burgerOpened, setBurgerOpened] = useState(false);
    const [isLoading, setLoading] = useState(false);

    const [aliases, setAliases] = useState<Alias[]>(props.aliases);

    const [itemsOnPage, setItemsOnPage] = useState(DEFAULT_ITEMS_ON_PAGE);
    const [page, setPage] = useState("1");
    const [searchState, setSearchState] = useState("");
    const [aliasStats, setAliasStats] = useState<{
        aliasesAmount?: number;
        premiumAliasesAmount?: number;
    }>({
        aliasesAmount: props.aliasesAmount,
        premiumAliasesAmount: props.premiumAliasesAmount
    });
    const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);

    const isPremiumOnly = selectedTitleIdx === 0;

    const isInMatrix = selectedTitleIdx === 2;

    const fetchIdRef = useRef<string>(nanoid());

    const fetchAliases = useCallback(async () => {
        const currentPage = parseInt(page, 10) || 0;
        const itemsAmount = parseInt(itemsOnPage, 10) || 0;

        const newFetchId = nanoid();
        fetchIdRef.current = newFetchId;

        setLoading(true);
        try {
            const result = await Fetch.getAliases(
                (currentPage - 1) * itemsAmount,
                itemsAmount,
                isPremiumOnly,
                searchState || undefined,
            );

            if (newFetchId !== fetchIdRef.current) return;
            if (result.sucess === false) return;
            if (!(result instanceof Array)) return;
            if (isInMatrix) return;
            setAliases(
                result.map((e: any) => ({
                    alias: e.alias || "",
                    address: e.address || "",
                    hasMatrixConnection: e.hasMatrixConnection || false
                }))
            );
        } catch (error) {
            console.error(error);
        } finally {
            if (newFetchId === fetchIdRef.current) setLoading(false);
        }
    }, [itemsOnPage, page, searchState, isPremiumOnly, isInMatrix]);

    const fetchMatrixAliases = useCallback(async () => {
        const result = await Fetch.getMatrixAddresses(page, itemsOnPage);
        if(!result.success || !(result.addresses instanceof Array)) return;
        const aliases = result.addresses.map((e :any)=>{
            return {...e, hasMatrixConnection: true}
        })
        setAliases(aliases);
    },[itemsOnPage, page])

    useEffect(() => {
        setPage("1");
    }, [isPremiumOnly, searchState]);

    useEffect(() => {
        if (isInMatrix) {
            fetchMatrixAliases();
        }
    }, [isInMatrix, fetchMatrixAliases])

    useEffect(() => {
        fetchAliases();

        const id = setInterval(fetchAliases, 20 * 1e3);

        return () => clearInterval(id);
    }, [fetchAliases]);

    useEffect(() => {
        async function fetchAliasesCount() {
            const result = await Fetch.getAliasesCount();
            const aliasesAmount = result?.aliasesAmount;
            const premiumAliasesAmount = result?.premiumAliasesAmount;
            setAliasStats({
                aliasesAmount: typeof aliasesAmount === "number" ? aliasesAmount : undefined,
                premiumAliasesAmount: typeof premiumAliasesAmount === "number" ? premiumAliasesAmount : undefined
            });
        }
        
        fetchAliasesCount();
    }, []);

    const tableHeaders = [ "NAME", "ADDRESS" ];

    function Alias({ alias, hasMatrixConnection }: { alias: string, hasMatrixConnection: boolean }) {
        
        return (
            alias.length <= 5 
            ?
            <div className={styles["alias_wrapper"]}>
                <>
                <div className={styles["short_alias"]}>
                    {alias}
                    <div className={styles["short_alias__crown"]}>
                        <CrownImg />
                    </div>
                </div>
                {hasMatrixConnection && <ConnectionIcon alias={alias}/>}
                </>
            </div> 
            :
            <div className={styles["alias_wrapper"]}>
                <>
                {alias}
                {hasMatrixConnection && <ConnectionIcon alias={alias}/>}                
                </>
            </div>
        );
    }

    function ConnectionIcon({alias}:{alias: string}){
        const [hovered, setHovered] = useState(false);
        const homeserver = process.env.NEXT_PUBLIC_MATRIX_HOMESERVER;
        const link = homeserver ? `https://matrix.to/#/@${alias}:${homeserver}` : "";

        const icon = (
        <div className={styles["connection_icon"]} onMouseEnter={ () => setHovered(true)}
            onMouseLeave={ ()=> setHovered(false)}
        >   <>
            <ConnectionImg/>
            {hovered && <div className={styles["connection_icon__tooltip"]}>
            <p>Matrix Connection</p>
                <div className={styles["connection_icon__tooltip__arrow"]}>
                </div>
            </div>}
            </>
        </div>
        );
        if (!link) return icon;
        return (
        <a href={link} target="_blank" rel="noreferrer">
            {icon}
        </a>
        )
    }

    const tableElements = aliases.map(e => [
        <Alias alias={e.alias} hasMatrixConnection={e.hasMatrixConnection}/>,
        e.address
    ]);

    const statsPanelData = [
        { key: "Total Aliases", value: aliasStats.aliasesAmount?.toString() || "..." },
        { key: "Premium", value: aliasStats.premiumAliasesAmount?.toString() || "..." }
    ];

    return (
        <div className={styles["aliases"]}>
            <Header 
                page="Aliases" 
                burgerOpened={burgerOpened} 
                setBurgerOpened={setBurgerOpened} 
            />
            <InfoTopPanel 
                burgerOpened={burgerOpened} 
                title="Aliases" 
                contentNotHiding
                inputDefaultClosed
                inputParams={{ 
                    placeholder: "name / address / comment",
                    state: searchState,
                    setState: setSearchState
                }}
                content={
                    <Switch
                        titles={["Premium", "All Aliases", "In Matrix"]}
                        selectedTitleIdx={selectedTitleIdx}
                        setSelectedTitleIdx={setSelectedTitleIdx}
                    />
                }
            />
            <CommonStatsPanel pairs={statsPanelData} className={styles["aliases__stats"]} />
            <div className={`${styles["aliases__table"]} custom-scroll`}>
                <Table 
                    isLoading={isLoading}
                    headers={tableHeaders}
                    elements={tableElements}
                    pagination
                    hidePaginationBlock
                    itemsOnPage={itemsOnPage}
                    setItemsOnPage={setItemsOnPage}
                    page={page}
                    setPage={setPage}
                />
            </div>
        </div>
    )
}

const getServerSideProps: GetServerSideProps = getAliases;
export { getServerSideProps };

export default Aliases;