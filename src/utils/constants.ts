const chartFontColor = "rgb(158, 170, 204)";

const chartTextLabels = {
    style: {
        color: chartFontColor
    }
};

const chartOptions: Highcharts.Options = {
    chart: {
        backgroundColor: "#2b3768",
        style: {
            fontSize: "14px"
        }
    },
    yAxis: {
        labels: chartTextLabels,
        title: {
            style: {
                ...chartTextLabels.style,
                fontWeight: "bold"
            }
        }
    },
    xAxis: {
        type: "datetime",
        labels: {
            ...chartTextLabels,
            format: '{value:%d.%b}'
        },
        lineColor: "#e6e6e6",
        tickColor: "#e6e6e6",
    },
    credits: {
        enabled: false
    },
    title: {
        style: {
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: "regular"
        }
    },
    legend: {
        itemStyle: {
            ...chartTextLabels.style,
            fontWeight: "bold"
        }
    },
    rangeSelector: {
        inputStyle: {
            ...chartTextLabels.style
        },
        inputBoxWidth: 123,
        inputBoxBorderColor: chartTextLabels.style.color,
        labelStyle: {
            ...chartTextLabels.style,
            fontSize: "12px"
        },
        buttonTheme: {
            fill: "#32439f",
            stroke: "#32439f",
            width: 64,
            fontSize: "14px",
            style: {
                color: "#ffffff",
            }
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
        xDateFormat: '%Y/%m/%d %H:%M'
    },
    plotOptions: {
        area: {
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: []
            },
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
                radius: 2
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