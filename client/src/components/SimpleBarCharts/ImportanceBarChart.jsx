import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import axios from 'axios';
// import './ChartStyles.css'; // Ensure this CSS file includes the provided styles

const ImportanceBarChart = () => {
    const [data, setData] = useState([]);
    const [importanceCounts, setImportanceCounts] = useState([]);

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

        const importance_order = ['Unknown', 'Low', 'Mid', 'High', 'Top'];
        const color_map_importance = {
            'Unknown': '#dcdcdc',
            'Low': '#ffd6ff',
            'Mid': '#ffc1ff',
            'High': '#ffacff',
            'Top': '#ff97ff'
        };

        console.log('Initial data:', data); // Debug statement
        // Verify column names
        if (!data[0].hasOwnProperty('importance_class')) {
            console.error('Column "importance_class" not found in data');
            return;
        }

        const importanceData = data.reduce((acc, item) => {
            acc[item.importance_class] = (acc[item.importance_class] || 0) + 1;
            return acc;
        }, {});

        console.log('Importance data counts:', importanceData); // Debug statement

        const importanceCounts = importance_order.map(importance => ({
            Importance: importance,
            Count: importanceData[importance] || 0,
            Color: color_map_importance[importance]
        }));

        console.log('Importance counts:', importanceCounts); // Debug statement

        setImportanceCounts(importanceCounts);
    }, [data]);

    return (
        <div className="plot-container">
            <Plot
                data={[
                    {
                        x: importanceCounts.map(item => item.Importance),
                        y: importanceCounts.map(item => item.Count),
                        type: 'bar',
                        marker: { color: importanceCounts.map(item => item.Color) },
                    }
                ]}
                layout={{
                    title: 'Number of Articles by Importance',
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

export default ImportanceBarChart;
