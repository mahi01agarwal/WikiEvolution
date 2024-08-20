import React from 'react';
import Plot from 'react-plotly.js';

const Graph = ({ data, metrics }) => {
    if (data.length === 0) return <div>Loading...</div>;

    const allGraphs = metrics.map((metric) => {
        const meanKey = `${metric}_mean`;
        const sumKey = `${metric}_sum`;

        const meanData = data.map(d => d[meanKey]);
        const sumData = data.map(d => d[sumKey]);
        const xData = data.map(d => d.month);

        // Plot both mean and sum with the same color and no legend
        const plotData = [
            {
                x: xData,
                y: meanData,
                type: 'scatter',
                mode: 'lines',
                name: `Mean ${metric.replace('_', ' ')}`,
                yaxis: 'y1',
                showlegend: false, // Hide the legend
                hovertemplate: `%{y}`,
                // customdata: sumData // Pass sum data to use in hovertemplate
            },
            {
                x: xData,
                y: sumData,
                type: 'scatter',
                mode: 'lines',
                name: `Sum ${metric.replace('_', ' ')}`,
                yaxis: 'y2',
                showlegend: false, // Hide the legend
                hovertemplate: `%{y}`,
                // customdata: meanData // Pass mean data to use in hovertemplate
            }
        ];

        return (
            <div key={metric} style={{ width: '100%', marginTop: '20px' }}>
                <Plot
                    data={plotData}
                    layout={{
                        title: `Mean and Sum of ${metric.replace('_', ' ')} over Time`,
                        xaxis: {
                            rangeselector: {
                                buttons: [
                                    { count: 6, label: '6M', step: 'month', stepmode: 'backward' },
                                    { count: 1, label: '1Y', step: 'year', stepmode: 'backward' },
                                    { count: 5, label: '5Y', step: 'year', stepmode: 'backward' },
                                    { step: 'all' }
                                ]
                            },
                            rangeslider: { visible: true },
                            type: 'date'
                        },
                        yaxis: {
                            title: `Mean ${metric.replace('_', ' ')}`,
                            side: 'left',
                            rangemode: 'tozero'
                        },
                        yaxis2: {
                            title: `Sum ${metric.replace('_', ' ')}`,
                            overlaying: 'y',
                            side: 'right',
                            rangemode: 'tozero'
                        },
                        template: 'plotly_white',
                        showlegend: false,
                        hovermode: 'x unified' // Ensure both traces' hover labels appear together
                    }}
                    config={{ displayModeBar: false }}
                    useResizeHandler={true}
                    style={{ width: "100%", height: "100%" }}
                />
            </div>
        );
    });

    return (
        <div>
            {allGraphs}
        </div>
    );
};

export default Graph;
