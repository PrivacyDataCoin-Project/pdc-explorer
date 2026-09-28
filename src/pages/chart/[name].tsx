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
            const result = await Utils.fetchChartInfo(chartId, 0);
            setLoading(false);
            if (!result) return;
            setChartSeries(result);
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
                title="Charts"
                back
            />
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
                                    maskFill: "rgba(102, 133, 194, 0.3)",
                                    maskInside: true
                                },
                                series: chartSeries.map((e, i) => ({
                                    type: "line",
                                    turboThreshold: 0,
                                    data: e,
                                    name: chartSeriesTitles[i],
                                    showInNavigator: true,
                                    dataGrouping: {
                                        enabled: true
                                    }
                                })),
                                title: {
                                    ...chartOptions.title,
                                    text: chartsInfo[chartId || ""]?.title || "",
                                },
                                chart: {
                                    ...chartOptions.chart,
                                    className: styles["chart_page__chart"],
                                    height: 700,
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
