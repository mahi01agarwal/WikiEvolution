import React from 'react';
import Plot from 'react-plotly.js';

const Graph = ({ data, selectedMetric }) => {
    if (data.length === 0) return <div>Loading...</div>;

    const plotData = [{
        x: data.map(d => d.year_month),
        y: data.map(d => d[selectedMetric]),
        type: 'scatter',
        mode: 'lines',
        name: selectedMetric.replace('_', ' ')
    }];

    return (
        <div style={{ width: '100%', marginTop: '20px' }}>
            <Plot
                data={plotData}
                layout={{
                    title: `Average ${selectedMetric.replace('_', ' ')} over Time`,
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
                    yaxis: { title: selectedMetric.replace('_', ' ') },
                    template: 'plotly_white'
                }}
                config={{ displayModeBar: false }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
};

export default Graph;
