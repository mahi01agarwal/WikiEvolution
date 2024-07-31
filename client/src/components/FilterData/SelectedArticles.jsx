import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import moment from 'moment';

const SelectedArticles = ({ selectedRows }) => {
    const [articleData, setArticleData] = useState([]);
    const [pageViewsData, setPageViewsData] = useState([]);

    useEffect(() => {
        // Fetch data for all selected articles when selectedRows change
        if (Array.isArray(selectedRows) && selectedRows.length > 0) {
            fetchAllArticlesData(selectedRows);
        } else {
            setArticleData([]);
            setPageViewsData([]);
        }
    }, [selectedRows]);

    const fetchAllArticlesData = (articles) => {
        const articlePromises = articles.map(article => 
            axios.get(`http://127.0.0.1:5000/get_article_data?page_id=${article.page_id}`)
        );

        Promise.all(articlePromises)
            .then(responses => {
                const allArticleData = responses.map(response => response.data);
                const aggregatedArticleData = aggregateArticleData(allArticleData);
                setArticleData(aggregatedArticleData);

                // Fetch page views data for the aggregated article data
                const titles = articles.map(article => article.page_title);
                const start = aggregatedArticleData[0]?.year_month.replace('-', '') + '01';
                const end = aggregatedArticleData[aggregatedArticleData.length - 1]?.year_month.replace('-', '') + '01';
                if (start && end) {
                    fetchPageViewsData(titles, start, end);
                }
            })
            .catch(error => {
                console.error('Error fetching article data:', error);
            });
    };

    const fetchPageViewsData = (titles, start, end) => {
        const pageViewsPromises = titles.map(title => 
            axios.get(`http://127.0.0.1:5000/get_pageviews?title=${title}&start=${start}&end=${end}`)
        );

        Promise.all(pageViewsPromises)
            .then(responses => {
                const allPageViewsData = responses.flatMap(response => response.data.items);
                const aggregatedPageViewsData = aggregatePageViewsData(allPageViewsData);
                setPageViewsData(aggregatedPageViewsData);
            })
            .catch(error => {
                console.error('Error fetching page views data:', error);
            });
    };

    const aggregateArticleData = (allArticleData) => {
        const aggregatedData = {};
        allArticleData.forEach(articleData => {
            articleData.forEach(dataPoint => {
                if (!aggregatedData[dataPoint.year_month]) {
                    aggregatedData[dataPoint.year_month] = { year_month: dataPoint.year_month, pred_qual: 0, count: 0 };
                }
                aggregatedData[dataPoint.year_month].pred_qual += dataPoint.pred_qual;
                aggregatedData[dataPoint.year_month].count += 1;
            });
        });
        return Object.values(aggregatedData).map(data => ({
            year_month: data.year_month,
            pred_qual: data.pred_qual / data.count,
        }));
    };

    const aggregatePageViewsData = (allPageViewsData) => {
        const monthlyData = allPageViewsData.reduce((acc, item) => {
            const month = moment(item.timestamp, "YYYYMMDDHH").format("YYYY-MM");
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += item.views;
            return acc;
        }, {});

        return Object.keys(monthlyData).map(month => ({
            month,
            views: monthlyData[month]
        }));
    };

    const downloadCSV = () => {
        const articleTitles = Array.isArray(selectedRows) ? selectedRows.map(article => article.page_title) : [];
        axios.post('http://127.0.0.1:5000/download_csv', articleTitles)
            .then(response => {
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'selected_articles.csv');
                document.body.appendChild(link);
                link.click();
            })
            .catch(error => console.error('Error downloading CSV:', error));
    };

    const downloadTitles = () => {
        const titles = Array.isArray(selectedRows) ? selectedRows.map(article => article.page_title).join('\n') : '';
        const blob = new Blob([titles], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'selected_article_titles.txt');
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="selected-articles">
            {selectedRows.length > 0 && (
                <div>
                    <button onClick={downloadCSV} className="btn btn-primary">
                        Download CSV
                    </button>
                    <button onClick={downloadTitles} className="btn btn-secondary">
                        Download Titles
                    </button>
                    <div className="plot-container">
                        {articleData.length > 0 && (
                            <>
                                <Plot
                                    data={[{
                                        x: articleData.map(d => d.year_month),
                                        y: articleData.map(d => d.pred_qual),
                                        type: 'scatter',
                                        mode: 'lines',
                                        name: 'Predicted Quality'
                                    }]}
                                    layout={{
                                        title: `Predicted Quality over Time`,
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
                                        yaxis: { title: 'Predicted Quality' },
                                        template: 'plotly_white'
                                    }}
                                    config={{ displayModeBar: false }}
                                    useResizeHandler={true}
                                    style={{ width: "100%", height: "100%" }}
                                />
                                <Plot
                                    data={[{
                                        x: pageViewsData.map(d => d.month),
                                        y: pageViewsData.map(d => d.views),
                                        type: 'scatter',
                                        mode: 'lines',
                                        name: 'Page Views'
                                    }]}
                                    layout={{
                                        title: `Page Views over Time`,
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
                                        yaxis: { title: 'Page Views' },
                                        template: 'plotly_white'
                                    }}
                                    config={{ displayModeBar: false }}
                                    useResizeHandler={true}
                                    style={{ width: "100%", height: "100%" }}
                                />
                            </>
                        )}
                    </div>
                </div>
            )}
            {selectedRows.length === 0 && (
                <p>No articles selected.</p>
            )}
        </div>
    );
};

export default SelectedArticles;
