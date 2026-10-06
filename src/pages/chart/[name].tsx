import styles from "@/styles/ChartPage.module.scss";
import { useEffect, useState } from "react";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts/highstock";
import { chartFontColor, chartOptions, chartRequestNames } from "@/utils/constants";
import ChartSeriesElem from "@/interfaces/common/ChartSeriesElem";
import Utils from "@/utils/utils";
import Preloader from "@/components/UI/Preloader/Preloader";
import { useRouter } from "next/router";

interface ChartInfo {
    title: string;
    yAxisTitle: string;
    seriesTitle: string;
}

function ChartPage() {

    const chartsInfo: { [key: string]: ChartInfo } = {
        "avg-block-size": {
            title: "Average Block Size",
            yAxisTitle: "MB",
            seriesTitle: "MB"
        },
        "avg-trans-per-block": {
            title: "Average Number Of Transactions Per Block",
            yAxisTitle: "Transactions Per Block",
            seriesTitle: "Transactions Per Block"
        },
        "hash-rate": {
            title: "Hash Rate",
            yAxisTitle: "Hash Rate H/s",
            seriesTitle: "Hash Rate 100"
        },
        "difficulty-pow": {
            title: "PoW Difficulty",
            yAxisTitle: "PoW Difficulty",
            seriesTitle: "PoW Difficulty"
        },
        "difficulty-pos": {
            title: "PoS Difficulty",
            yAxisTitle: "PoS Difficulty",
            seriesTitle: "PoS Difficulty"
        },
        "confirm-trans-per-day": {
            title: "Confirmed Transactions Per Day",
            yAxisTitle: "Transactions",
            seriesTitle: "Transactions"
        }
    }

    const [loading, setLoading] = useState(true);

    const [burgerOpened, setBurgerOpened] = useState(false);

    // The only values that chartId param can have are the keys of the chartRequestNames object. 
    // Other values will cause redirect to the home page.
    const router = useRouter();
    const { name } = router.query;
    const chartId: string | undefined = Array.isArray(name) ? name[0] : name;

    const [chartSeries, setChartSeries] = useState<ChartSeriesElem[][]>([]);
    const chartSeriesTitles = [
        chartsInfo[chartId || ""]?.seriesTitle || "",
        "Hash Rate 400",
        "Difficulty 120"
    ];

    useEffect(() => {
        async function fetchChart() {
            if (!chartId) return;
            setLoading(true);
            try {
                const result = await Utils.fetchChartInfo(chartId, 0);
                if (result) setChartSeries(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        if (!(chartId && chartRequestNames[chartId])) {
            router.push("/");
        } else {
            fetchChart();
        }
    }, [chartId]);

    return (
        <div className={styles["chart_page"]}>
            <Header
                page="Charts"
                burgerOpened={burgerOpened}
                setBurgerOpened={setBurgerOpened}
            />
            <InfoTopPanel
                burgerOpened={burgerOpened}
                title={chartsInfo[chartId || ""]?.title || "Charts"}
                back
                hideSearch
            />
            <div className={styles.head}>
                <h2>{chartsInfo[chartId || ""]?.title || "Chart"}</h2>
                <p>{chartsInfo[chartId || ""]?.yAxisTitle || ""}</p>
            </div>
            <div className={styles["chart_page__chart__wrapper"]}>
                {
                    loading ?
                    (
                        <div className={styles["chart_page__preloader"]}>
                            <Preloader />
                        </div>
                    )
                    :
                    (
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={{
                                ...chartOptions,
                                navigator: {
                                    enabled: true,
                                    maskFill: "rgba(59, 199, 255, 0.16)",
                                    maskInside: true,
                                    outlineColor: "rgba(255, 255, 255, 0.08)",
                                    handles: {
                                        backgroundColor: "#3bc7ff",
                                        borderColor: "#121d92",
                                    },
                                    series: {
                                        color: "#3bc7ff",
                                        lineColor: "#3bc7ff",
                                    },
                                    xAxis: {
                                        labels: {
                                            style: { color: chartFontColor, fontSize: "11px" },
                                        },
                                        gridLineColor: "transparent",
                                    },
                                },
                                scrollbar: {
                                    enabled: false,
                                },
                                series: chartSeries.map((e, i) => ({
                                    type: i === 0 ? "area" : "line",
                                    color: ["#3bc7ff", "#7aa2ff", "#3ee0a0"][i] || "#3bc7ff",
                                    turboThreshold: 0,
                                    data: e,
                                    name: chartSeriesTitles[i],
                                    showInNavigator: i === 0,
                                    dataGrouping: {
                                        enabled: true
                                    }
                                })),
                                title: {
                                    text: undefined,
                                },
                                chart: {
                                    ...chartOptions.chart,
                                    className: styles["chart_page__chart"],
                                    height: 560,
                                },
                                rangeSelector: {
                                    ...chartOptions.rangeSelector,
                                    enabled: true,
                                },
                                yAxis: {
                                    ...chartOptions.yAxis,
                                    title: {
                                        style: {
                                            color: chartFontColor,
                                            fontWeight: "bold"
                                        },
                                        text: chartsInfo[chartId || ""]?.yAxisTitle || "",
                                    }
                                },
                                responsive: {
                                    rules: [
                                        {
                                            condition: {
                                                maxWidth: 575
                                            },
                                            chartOptions: {
                                                chart: {
                                                    width: 575
                                                },
                                                rangeSelector: {
                                                    inputPosition: {
                                                        align: 'left'
                                                    }
                                                }
                                            }
                                        }
                                    ]
                                }
                            }}
                        />
                    )
                }
            </div>
        </div>
    )
}

export default ChartPage;
