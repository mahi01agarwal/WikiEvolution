import React from 'react';
import Select from 'react-select';

const Dropdown = ({ selectedMetric, handleMetricChange }) => {
    const metricOptions = [
        { value: 'pred_qual', label: 'Predicted Quality' },
        { value: 'num_refs', label: 'Number of References' },
        { value: 'num_media', label: 'Number of Media' },
        { value: 'num_categories', label: 'Number of Categories' },
        { value: 'num_wikilinks', label: 'Number of Wikilinks' },
        { value: 'num_headings', label: 'Number of Headings' },
        { value: 'page_length', label: 'Page Length' } 
    ];

    return (
        <Select
            options={metricOptions}
            onChange={handleMetricChange}
            value={metricOptions.find(option => option.value === selectedMetric)}
            placeholder="Select a metric"
            styles={{
                container: (provided) => ({
                    ...provided,
                    marginBottom: '20px',
                    width: '100%',
                }),
                control: (provided) => ({
                    ...provided,
                    width: '100%',
                }),
                menu: (provided) => ({
                    ...provided,
                    width: '100%',
                }),
            }}
        />
    );
};

export default Dropdown;
