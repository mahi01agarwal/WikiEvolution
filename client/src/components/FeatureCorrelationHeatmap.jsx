import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';

const FeatureCorrelationHeatmap = () => {
    const [keys, setKeys] = useState([]);
    const [values, setValues] = useState([]);

    useEffect(() => {
        // Fetch the correlation data from the backend
        axios.get('http://127.0.0.1:5000/get_correlation')
            .then(response => {
                console.log('Raw response data:', response.data); // Log the raw response data
                const parsedData = JSON.parse(response.data);
                console.log('Parsed data:', parsedData); // Log the parsed data
                
                let keys = Object.keys(parsedData.pred_qual);
                let values = keys.map(key => parsedData.pred_qual[key]);
                
                // Check for NaN values
                if (values.some(val => isNaN(val))) {
                    console.error('Correlation matrix contains NaN values:', values);
                } else {
                    // Sort keys and values based on the correlation values
                    const sortedData = keys.map((key, index) => ({ key, value: values[index] }))
                                          .sort((a, b) => a.value - b.value);
                    keys = sortedData.map(item => item.key);
                    values = sortedData.map(item => item.value);

                    setKeys(keys);
                    setValues(values);
                }
            })
            .catch(error => {
                console.error('Error fetching correlation data:', error);
            });
    }, []);

    if (keys.length === 0 || values.length === 0) {
        return <div>Loading...</div>;
    }

    // Define a custom colorscale
    const customColorscale = [
        [0, 'rgb(230, 245, 255)'], // Light blue for low correlation
        [1, 'rgb(8, 48, 107)']      // Dark blue for high correlation
    ];

    // Create the heatmap
    return (
        <div className="plot-container">
            <Plot
                data={[
                    {
                        z: [values],
                        x: keys,
                        y: ['pred_qual'],
                        type: 'heatmap',
                        colorscale: customColorscale,
                        showscale: true,
                        colorbar: {
                            title: 'Correlation',
                            titleside: 'right'
                        }
                    }
                ]}
                layout={{
                    title: 'Correlation of Features with pred_qual',
                    xaxis: {
                        // title: 'Features',
                        automargin: true,
                        tickangle: -45, // Rotate x-axis labels for better readability
                    },
                    yaxis: {
                        // title: 'pred_qual',
                        automargin: true,
                    },
                    height: 300, // Adjust height for smaller boxes
                    width: '100%',  // Ensure width is 100%
                    // margin: {
                    //     // l: 50,
                    //     // r: 50,
                    //     // b: 100, // Increase bottom margin for rotated labels
                    //     // t: 50,
                    // },
                    plot_bgcolor: '#ffffff', // Optional: Change background color
                    paper_bgcolor: '#ffffff', // Optional: Change paper background color
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '100%' }}
            />
        </div>
    );
};

export default FeatureCorrelationHeatmap;
