import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
// import './ChartStyles.css'; // Ensure this CSS file includes the provided styles

const QualityBarChart = () => {
    const [data, setData] = useState([]);
    const [qualityCounts, setQualityCounts] = useState([]);

    useEffect(() => {
        axios.get('http://127.0.0.1:5000/get_csv_data')
            .then(response => {
                console.log('Fetched data:', response.data); // Debug statement
                setData(response.data);
            })
            .catch(error => console.error('Error fetching data:', error));
    }, []);

    useEffect(() => {
        if (data.length === 0) return;

        const quality_order = ['List', 'Stub', 'Start', 'C', 'B', "GA", 'A', 'FL', 'FA'];
        const color_map = {
            'List': '#c7b1ff',
            'Stub': '#ffa4a4',
            'Start': '#ffaa66',
            'C': '#ffff66',
            'B': '#b2ff66',
            'GA': '#66ff66',
            'A': '#66ffff',
            'FL': '#9cbdff',
            'FA': '#9cbdff'
        };

        console.log('Initial data:', data); // Debug statement
        // Verify column names
        if (!data[0].hasOwnProperty('quality_class')) {
            console.error('Column "quality_class" not found in data');
            return;
        }

        const filteredData = data.filter(item => !['Disambig', 'Redirect'].includes(item.quality_class));
        console.log('Filtered data:', filteredData); // Debug statement

        const qualityData = filteredData.reduce((acc, item) => {
            acc[item.quality_class] = (acc[item.quality_class] || 0) + 1;
            return acc;
        }, {});

        console.log('Quality data counts:', qualityData); // Debug statement

        const qualityCounts = quality_order.map(quality => ({
            Quality: quality,
            Count: qualityData[quality] || 0,
            Color: color_map[quality]
        }));

        console.log('Quality counts:', qualityCounts); // Debug statement

        setQualityCounts(qualityCounts);
    }, [data]);

    return (
        <div className="plot-container">
            <Plot
                data={[
                    {
                        x: qualityCounts.map(item => item.Quality),
                        y: qualityCounts.map(item => item.Count),
                        type: 'bar',
                        marker: { color: qualityCounts.map(item => item.Color) },
                    }
                ]}
                layout={{
                    title: 'Number of Articles by Quality',
                    plot_bgcolor: 'white',
                    paper_bgcolor: 'white',
                    xaxis: { showgrid: true, gridcolor: 'lightgrey' },
                    yaxis: { showgrid: true, gridcolor: 'lightgrey' },
                    autosize: true,
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
};

export default QualityBarChart;
