import React from 'react';
import Plot from 'react-plotly.js';

const RadarChart = ({ articleData }) => {
    if (!articleData || articleData.length === 0) {
        return <div>No data available for the selected article.</div>;
    }

    const categories = ['num_refs', 'num_wikilinks', 'num_media', 'num_categories', 'num_headings'];

    const radarData = {
        type: 'scatterpolar',
        r: categories.map(category => articleData[0][category]), // Use the first entry for radar chart
        theta: categories,
        fill: 'toself',
        name: articleData[0].page_title
    };

    return (
        <div className="plot-container">
            <Plot
                data={[radarData]}
                layout={{
                    polar: {
                        radialaxis: {
                            visible: true,
                            range: [0, Math.max(...categories.map(category => articleData[0][category]))]
                        }
                    },
                    title: 'Radar Chart'
                }}
                config={{ displayModeBar: false }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
};

export default RadarChart;
