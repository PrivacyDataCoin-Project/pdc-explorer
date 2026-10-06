const chartFontColor = "#9aabc8";
const chartLine = "rgba(255, 255, 255, 0.08)";
const chartCyan = "#3bc7ff";

const chartTextLabels = {
    style: {
        color: chartFontColor,
        fontSize: "11px",
    }
};

const chartOptions: Highcharts.Options = {
    chart: {
        backgroundColor: "transparent",
        style: {
            fontFamily: "Plus Jakarta Sans, Segoe UI, sans-serif",
            fontSize: "12px",
        },
        spacing: [12, 8, 8, 8],
    },
    colors: [chartCyan, "#7aa2ff", "#3ee0a0"],
    yAxis: {
        gridLineColor: chartLine,
        gridLineDashStyle: "Dash",
        labels: chartTextLabels,
        title: {
            style: {
                ...chartTextLabels.style,
                fontWeight: "600",
            }
        }
    },
    xAxis: {
        type: "datetime",
        labels: {
            ...chartTextLabels,
            format: "{value:%d %b}",
        },
        lineColor: chartLine,
        tickColor: "transparent",
        gridLineColor: "transparent",
    },
    credits: {
        enabled: false
    },
    title: {
        style: {
            color: "#ffffff",
            fontSize: "16px",
            fontWeight: "600",
        }
    },
    legend: {
        itemStyle: {
            ...chartTextLabels.style,
            fontSize: "12px",
            fontWeight: "600",
        },
        itemHoverStyle: {
            color: "#ffffff",
        },
    },
    rangeSelector: {
        inputStyle: {
            ...chartTextLabels.style,
            color: "#e8eefc",
            fontSize: "12px",
        },
        inputBoxWidth: 110,
        inputBoxBorderColor: chartLine,
        labelStyle: {
            ...chartTextLabels.style,
            fontSize: "12px",
        },
        buttonTheme: {
            fill: "rgba(255, 255, 255, 0.04)",
            stroke: "transparent",
            r: 8,
            width: 58,
            style: {
                color: chartFontColor,
                fontWeight: "600",
            },
            states: {
                hover: {
                    fill: "rgba(59, 199, 255, 0.16)",
                    style: {
                        color: "#ffffff",
                    },
                },
                select: {
                    fill: "#1e30f3",
                    style: {
                        color: "#ffffff",
                        fontWeight: "700",
                    },
                },
            },
        },
        buttons: [
            {
                type: "day",
                count: 1,
                text: "day"
            },
            {
                type: "day",
                count: 7,
                text: "week"
            },
            {
                type: "month",
                count: 1,
                text: "month"
            },
            {
                type: "month",
                count: 3,
                text: "quarter"
            },
            {
                type: "year",
                count: 1,
                text: "year"
            },
            {
                type: "all",
                text: "All"
            }
        ]
    },
    tooltip: {
        enabled: true,
        backgroundColor: "#10132b",
        borderColor: chartLine,
        borderRadius: 10,
        shadow: false,
        style: {
            color: "#e8eefc",
            fontSize: "12px",
        },
        xDateFormat: "%Y-%m-%d %H:%M",
    },
    plotOptions: {
        area: {
            lineWidth: 2,
            color: chartCyan,
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, "rgba(59, 199, 255, 0.38)"],
                    [1, "rgba(59, 199, 255, 0.02)"],
                ]
            },
            states: {
                hover: {
                    lineWidthPlus: 0,
                }
            },
            threshold: null
        },
        series: {
            lineWidth: 2,
            marker: {
                enabled: false,
                radius: 3,
                states: {
                    hover: {
                        enabled: true,
                        radius: 4,
                    }
                }
            }
        }          
    }
}

const chartRequestNames: { [key: string]: string } = {
    "avg-block-size": "AvgBlockSize",
    "avg-trans-per-block": "AvgTransPerBlock",
    "hash-rate": "hashRate",
    "difficulty-pow": "pow-difficulty",
    "difficulty-pos": "pos-difficulty",
    "confirm-trans-per-day": "ConfirmTransactPerDay" 
}

const chartDataFieldMap: { [key: string]: string } = {
    "avg-block-size": "bcs",
    "avg-trans-per-block": "trc",
    "confirm-trans-per-day": "sum_trc",
    "difficulty-pow": "d"
};

export { chartOptions, chartFontColor, chartRequestNames, chartDataFieldMap };
export { PDC_ASSET_ID } from "@/config/network";