import styles from "@/styles/Charts.module.scss";
import { useState, useEffect } from "react";
import Header from "@/components/default/Header/Header";
import InfoTopPanel from "@/components/default/InfoTopPanel/InfoTopPanel";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import { chartOptions } from "@/utils/constants";
import Utils from "@/utils/utils";
import ChartSeriesElem from "@/interfaces/common/ChartSeriesElem";
import Preloader from "@/components/UI/Preloader/Preloader";
import Link from "next/link";

function Charts() {
    const [burgerOpened, setBurgerOpened] = useState(false);

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

            for (const title of titles) {
                const result = await Utils.fetchChartInfo(title, offset);
                console.log('data loaded:', title);
                
                if (!result) continue;

                results.push({
                    title: title,
                    data: result.map(
                        series => series.filter(e => e.x > offset - chartPeriod)
                    )
                });
            }

            setChartsSeries(prev => ({ 
                ...prev, 
                ...Object.fromEntries(results.map(e => [e.title, e.data] as [string, ChartSeriesElem[][]] ))
            }))
                
            setLoaded(true);
        }

        fetchCharts();
    }, [loaded]);

    function Chart(props: { title: string, requestTitle: string, disabled?: boolean }) {
        const {
            title,
            requestTitle
        } = props;

        return (
            <Link href={"/chart/" + requestTitle} className={styles["charts__chart__wrapper"]} style={
                props.disabled ? { pointerEvents: "none", opacity: 0.3 } : {}
            }>
                <div className={styles["charts__chart__title"]}>
                    <p>{title}</p>
                </div>
                <HighchartsReact 
                    highcharts={Highcharts}
                    options={{
                        ...chartOptions,
                        title: {
                            text: undefined
                        },
                        series: chartsSeries[requestTitle]?.map(e => ({
                            type: "line",
                            data: e,
                            turboThreshold: 0,
                            animation: false
                        })),
                        chart: {
                            ...chartOptions.chart,
                            height: 280,
                            className: styles["charts__chart"]
                        },
                        tooltip: {
                            enabled: false
                        },
                        legend: {
                            enabled: false
                        },
                        yAxis: {
                            ...chartOptions.yAxis,
                            title: {
                                text: ""
                            }
                        },
                        plotOptions: {
                            area: {
                                lineWidth: 2,
                                states: {
                                    hover: {
                                        lineWidth: 1
                                    }
                                },
                                threshold: null
                            },
                            series: {
                                marker: {
                                    enabled: false
                                }
                            }      
                        }
                    }}
                />
            </Link>
            
        )
    }

    return (
        <div className={styles["charts"]}>
            <Header 
                page="Charts" 
                burgerOpened={burgerOpened} 
                setBurgerOpened={setBurgerOpened} 
            />
            <InfoTopPanel 
                burgerOpened={burgerOpened} 
                title="Charts" 
            />
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
                        title="Hash Rate (inactive)" 
                        requestTitle="hash-rate"
                        disabled={true}
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