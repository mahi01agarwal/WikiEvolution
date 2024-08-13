import React from 'react';
import Plot from 'react-plotly.js';

const Graph = ({ data, metrics }) => {
    if (data.length === 0) return <div>Loading...</div>;

    // Iterate through all the metrics to create plots for each one
    const allGraphs = metrics.map((metric) => {
        // Dynamically construct the keys for mean and sum
        const meanKey = `${metric}_mean`;
        const sumKey = `${metric}_sum`;

        // Extract the data for plotting
        const meanData = data.map(d => d[meanKey]);
        const sumData = data.map(d => d[sumKey]);
        const xData = data.map(d => d.month);

        // Debugging: Check if the data arrays are populated correctly
        console.log(`Mean Data for ${metric}:`, meanData);
        console.log(`Sum Data for ${metric}:`, sumData);
        console.log('X Data:', xData);

        const plotData = [
            {
                x: xData,
                y: meanData,
                type: 'scatter',
                mode: 'lines',
                name: `Mean ${metric.replace('_', ' ')}`,
                yaxis: 'y1'
            },
            {
                x: xData,
                y: sumData,
                type: 'scatter',
                mode: 'lines',
                name: `Sum ${metric.replace('_', ' ')}`,
                yaxis: 'y2'
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
                            side: 'left'
                        },
                        yaxis2: {
                            title: `Sum ${metric.replace('_', ' ')}`,
                            overlaying: 'y',
                            side: 'right'
                        },
                        template: 'plotly_white'
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
