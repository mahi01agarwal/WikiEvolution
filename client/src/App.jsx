import React, { useEffect, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import FilterTable from './components/FilterData/FilterTable';
import QualityImportanceStackedBarChart from './components/SimpleBarCharts/QualityImportanceStackedBarChart';
import ImportanceQualityStackedBarChart from './components/SimpleBarCharts/ImportanceQualityStackedBarChart';
import Graph from './components/AverageOfFeatures/Graph';
import WikiProjectDropdown from './components/WikiProjectDropdown';
import './App.css';
import axios from 'axios';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const App = () => {
  const [selectedProject, setSelectedProject] = useState('');
  const [data, setData] = useState([]);

  const metrics = [
    'pred_qual',
    'num_refs',
    'num_media',
    'num_categories',
    'num_wikilinks',
    'num_headings',
    'page_length'
  ];

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    // Fetch data after selecting a project
    fetchData(project);
  };

  const fetchData = (project) => {
    // Fetch data for the selected project
    axios.get(`http://127.0.0.1:5000/get_csv_data_monthly_aggregated?project=${project}`)
      .then(response => {
        console.log('Fetched data:', response.data);
        setData(response.data);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  return (
    <div className="main-container">
      <Header />
      <section>
        <div className='margin-top-3'>
          <WikiProjectDropdown onSelectProject={handleProjectSelect} />
        </div>
        {selectedProject && (
          <>
            <div className="section-text margin-top-3">
              <a
                href={`https://en.wikipedia.org/w/index.php?title=Wikipedia:WikiProject_${selectedProject}&oldid=1222553608`}
                target="_blank"
                rel="noopener noreferrer"
                className="title-link"
              >
                {`Wikipedia:WikiProject ${selectedProject}`}
              </a>
            </div>

            <Tabs className="margin-top-3">
              <TabList>
                <Tab>Wikiproject Overview</Tab>
                <Tab>Drill Down</Tab>
              </TabList>

              <TabPanel>
                <div className="margin-top-3">
                  <QualityImportanceStackedBarChart />
                </div>
                <div className="margin-top-3">
                  <ImportanceQualityStackedBarChart />
                </div>
                <div className="margin-top-3">
                  <Graph data={data} metrics={metrics} />
                </div>
              </TabPanel>

              <TabPanel>
                <div className="margin-top-3">
                  <FilterTable />
                </div>
                {/* <div className="margin-top-3">
                  <FeatureCorrelationHeatmap />
                </div> */}
              </TabPanel>
            </Tabs>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
};

export default App;
