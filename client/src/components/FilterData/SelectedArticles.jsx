import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import RadarChart from './RadarChart';
import Select from 'react-select';
import moment from 'moment';

const SelectedArticles = ({ selectedRows }) => {
    const [articleData, setArticleData] = useState([]);
    const [pageViewsData, setPageViewsData] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState('');

    useEffect(() => {
        // Reset the selected article when selectedRows change
        setSelectedArticle('');
        setArticleData([]);
        setPageViewsData([]);
    }, [selectedRows]);

    const fetchArticleData = (pageId) => {
        axios.get(`http://127.0.0.1:5000/get_article_data?page_id=${pageId}`)
            .then(response => {
                setArticleData(response.data);
            })
            .catch(error => {
                console.error('Error fetching article data:', error);
            });
    };

    const fetchPageViewsData = (title, start, end) => {
        axios.get(`http://127.0.0.1:5000/get_pageviews?title=${title}&start=${start}&end=${end}`)
            .then(response => {
                const dailyData = response.data.items;
                const monthlyData = aggregateMonthlyData(dailyData);
                setPageViewsData(monthlyData);
            })
            .catch(error => {
                console.error('Error fetching page views data:', error);
            });
    };

    const aggregateMonthlyData = (dailyData) => {
        const monthlyData = dailyData.reduce((acc, item) => {
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

    const handleArticleChange = (selectedOption) => {
        setSelectedArticle(selectedOption.value);
        const selectedArticle = selectedRows.find(article => article.page_title === selectedOption.value);
        if (selectedArticle) {
            fetchArticleData(selectedArticle.page_id);
        }
    };

    useEffect(() => {
        if (articleData.length > 0 && selectedArticle) {
            const start = articleData[0]?.year_month.replace('-', '') + '01';
            const end = articleData[articleData.length - 1]?.year_month.replace('-', '') + '01';
            if (start && end) {
                fetchPageViewsData(selectedArticle, start, end);
            }
        }
    }, [articleData, selectedArticle]);

    // Use a Set to eliminate duplicates and only include selected articles
    const selectedArticlesSet = new Set(Array.isArray(selectedRows) ? selectedRows.map(article => article.page_title) : []);
    const selectedArticles = Array.from(selectedArticlesSet).map(title => selectedRows.find(article => article.page_title === title));

    const articleOptions = selectedArticles.map(article => ({
        value: article.page_title,
        label: article.page_title
    }));

    return (
        <div className="selected-articles">
            {selectedArticles.length > 0 && (
                <div>
                    <button onClick={downloadCSV} className="btn btn-primary">
                        Download CSV
                    </button>
                    <button onClick={downloadTitles} className="btn btn-secondary">
                        Download Titles
                    </button>
                    <div className="article-selector">
                        <Select
                            options={articleOptions}
                            onChange={handleArticleChange}
                            value={articleOptions.find(option => option.value === selectedArticle)}
                            placeholder="Select an article"
                            styles={{
                                container: (provided) => ({
                                    ...provided,
                                    marginBottom: '20px',
                                    width: '300px',
                                }),
                                control: (provided) => ({
                                    ...provided,
                                    width: '300px',
                                }),
                                menu: (provided) => ({
                                    ...provided,
                                    width: '300px',
                                }),
                            }}
                        />
                    </div>
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
                                {/* <RadarChart articleData={articleData} /> */}
                            </>
                        )}
                    </div>
                </div>
            )}
            {selectedArticles.length === 0 && (
                <p>No articles selected.</p>
            )}
        </div>
    );
};

export default SelectedArticles;
