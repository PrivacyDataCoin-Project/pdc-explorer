import styles from "@/styles/Charts.module.scss";
import { useState, useEffect } from "react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { chartOptions } from "@/utils/constants";
import Utils from "@/utils/utils";
import ChartSeriesElem from "@/interfaces/common/ChartSeriesElem";
import Preloader from "@/components/UI/Preloader/Preloader";
import Link from "next/link";

function Charts() {
    const [chartsSeries, setChartsSeries] = useState<{ [key: string]: ChartSeriesElem[][] | undefined }>(
        {
            "avg-block-size": undefined,
            "avg-trans-per-block": undefined,
            "hash-rate": undefined,
            "difficulty-pow": undefined,
            "difficulty-pos": undefined,
            "confirm-trans-per-day": undefined
        }
    );
    

    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function fetchCharts() {
            if (loaded) {
                return;
            }

            const titles = [
                "avg-block-size",
                "avg-trans-per-block",
                "hash-rate",
                "difficulty-pow",
                "difficulty-pos",
                "confirm-trans-per-day"
            ];

            const chartPeriod = 7 * 24 * 60 * 60 * 1e3;
            const offset = +new Date() - chartPeriod;
    
            const results: { title: string, data: ChartSeriesElem[][] }[] = [];

            try {
                for (const title of titles) {
                    try {
                        const result = await Utils.fetchChartInfo(title, offset);
                        if (!result) continue;

                        results.push({
                            title: title,
                            data: result.map(
                                series => series.filter(e => e.x > offset - chartPeriod)
                            )
                        });
                    } catch (error) {
                        console.error(error);
                    }
                }

                setChartsSeries(prev => ({
                    ...prev,
                    ...Object.fromEntries(results.map(e => [e.title, e.data] as [string, ChartSeriesElem[][]]))
                }))
            } finally {
                setLoaded(true);
            }
        }

        fetchCharts();
    }, [loaded]);

    function latestValue(requestTitle: string) {
        const series = chartsSeries[requestTitle]?.[0];
        const point = series?.[series.length - 1];
        if (!point || !Number.isFinite(point.y)) return "—";
        const abs = Math.abs(point.y);
        if (abs >= 1e15) return `${(point.y / 1e15).toFixed(2)} P`;
        if (abs >= 1e12) return `${(point.y / 1e12).toFixed(2)} T`;
        if (abs >= 1e9) return `${(point.y / 1e9).toFixed(2)} B`;
        if (abs >= 1e6) return `${(point.y / 1e6).toFixed(2)} M`;
        if (abs >= 1e3) return `${(point.y / 1e3).toFixed(2)} K`;
        return Utils.formatNumber(point.y, abs < 10 ? 2 : 0);
    }

    function Chart(props: { title: string, requestTitle: string, disabled?: boolean }) {
        const {
            title,
            requestTitle
        } = props;
        const series = chartsSeries[requestTitle]?.[0];

        return (
            <Link href={"/chart/" + requestTitle} className={styles["charts__chart__wrapper"]} style={
                props.disabled ? { pointerEvents: "none", opacity: 0.3 } : {}
            }>
                <div className={styles["charts__chart__title"]}>
                    <div>
                        <p>7 days</p>
                        <h3>{title}</h3>
                    </div>
                    <strong>{latestValue(requestTitle)}</strong>
                </div>
                {series?.length ? (
                    <HighchartsReact
                        highcharts={Highcharts}
                        options={{
                            ...chartOptions,
                            title: {
                                text: undefined
                            },
                            series: [{
                                type: "area",
                                data: series,
                                turboThreshold: 0,
                                animation: { duration: 400 },
                            }],
                            chart: {
                                ...chartOptions.chart,
                                height: 210,
                                className: styles["charts__chart"],
                            },
                            tooltip: {
                                ...chartOptions.tooltip,
                                enabled: false,
                            },
                            legend: {
                                enabled: false
                            },
                            yAxis: {
                                ...chartOptions.yAxis,
                                title: {
                                    text: ""
                                },
                                labels: {
                                    enabled: false,
                                },
                            },
                            xAxis: {
                                ...chartOptions.xAxis,
                                labels: {
                                    enabled: false,
                                },
                                lineWidth: 0,
                            },
                        }}
                    />
                ) : (
                    <p className={styles.empty}>No samples in this window</p>
                )}
            </Link>
        )
    }

    return (
        <div className={styles["charts"]}>
            <div className={styles.head}>
                <h2>Charts</h2>
                <p>Last 7 days. Open a card for the full range.</p>
            </div>
            {loaded ?
                <div className={styles["charts__container"]}>
                    <Chart 
                        title="Average Block Size"
                        requestTitle="avg-block-size"
                    />
                    <Chart 
                        title="Average Number Of Transactions Per Block"
                        requestTitle="avg-trans-per-block"
                    />
                    <Chart 
                        title="Hash Rate" 
                        requestTitle="hash-rate"
                    />
                    <Chart 
                        title="PoW Difficulty" 
                        requestTitle="difficulty-pow"
                    />
                    <Chart 
                        title="PoS Difficulty" 
                        requestTitle="difficulty-pos"
                    />
                    <Chart 
                        title="Confirmed Transaction Per Day"
                        requestTitle="confirm-trans-per-day" 
                    />
                </div> : 
                <div className={styles["charts__preloader"]}>
                    <Preloader />
                </div>
            }
        </div>
    )
}

export default Charts;