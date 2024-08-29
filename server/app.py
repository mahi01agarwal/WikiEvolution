from flask import Flask, request, jsonify,Response
import pandas as pd
import io
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import os
import process_wikiproject_monthly
import process_wikiproject_latest

app = Flask(__name__)
CORS(app)

selected_wikiproject = None

@app.route('/set_selected_wikiproject', methods=['POST'])
def set_selected_wikiproject():
    global selected_wikiproject
    data = request.json
    selected_wikiproject = data.get('project_name')
    
    if not selected_wikiproject:
        return jsonify({'error': 'No WikiProject name provided'}), 400
    
    # Call the first processing function
    try:
        process_wikiproject_monthly.main(selected_wikiproject)
    except Exception as e:
        return jsonify({'error': f"Failed to process monthly data: {str(e)}"}), 500
    
    # Call the second processing function
    try:
        process_wikiproject_latest.main(selected_wikiproject)
        return jsonify({'success': f'Selected WikiProject set to {selected_wikiproject} and processing started for both scripts.'}), 200
    except Exception as e:
        return jsonify({'error': f"Failed to process latest data: {str(e)}"}), 500

# Fetch WikiProjects from the URL
@app.route('/get_wikiprojects', methods=['GET'])
def get_wikiprojects():
    url = 'https://analytics.wikimedia.org/published/datasets/outreachy-round-28/revisions/'
    response = requests.get(url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        links = soup.find_all('a')
        wikiprojects = [link.get('href') for link in links if link.get('href').endswith('.csv')]
        wikiproject_names = [link.replace('.csv', '') for link in wikiprojects]
        return jsonify(wikiproject_names)
    else:
        print(f'Failed to fetch WikiProjects, status code: {response.status_code}')
        print(response.text)
        return jsonify({'error': 'Failed to fetch WikiProjects'}), 500
    

@app.route('/get_csv_data', methods=['GET'])
def get_csv_data():
    df = pd.read_csv('df_revisions_pred_manual_Carribean.csv')
    return jsonify(df.to_dict(orient='records'))    

@app.route('/get_csv_data_monthly_aggregated', methods=['GET'])
def get_csv_data_monthly_aggregated():
    try:
        # Ensure that the selected_wikiproject is set
        if not selected_wikiproject:
            return jsonify({"error": "No WikiProject selected"}), 400

        # Construct the CSV file name based on the selected Wikiproject
        csv_file_name = f"{selected_wikiproject}_latest_monthly.csv"
        
        # Check if the file exists
        if not os.path.exists(csv_file_name):
            return jsonify({"error": f"CSV file '{csv_file_name}' does not exist"}), 404
        
        # Read the CSV file
        df = pd.read_csv(csv_file_name)
        
        # Convert 'month' column to datetime
        df['month'] = pd.to_datetime(df['month'], format='%Y-%m')
        
        # Sort the dataframe by 'month'
        df = df.sort_values(by='month')
        
        # Select only numeric columns for aggregation
        numeric_columns = df.select_dtypes(include='number').columns
        
        # Calculate monthly unique mean
        monthly_mean = df.groupby(df['month'].dt.to_period('M'))[numeric_columns].mean().reset_index()
        
        # Calculate monthly unique sum
        monthly_sum = df.groupby(df['month'].dt.to_period('M'))[numeric_columns].sum().reset_index()
        
        # Convert 'month' back to string for JSON serialization
        monthly_mean['month'] = monthly_mean['month'].astype(str)
        monthly_sum['month'] = monthly_sum['month'].astype(str)
        
        # Merge mean and sum dataframes
        monthly_aggregated = monthly_mean.merge(monthly_sum, on='month', suffixes=('_mean', '_sum'))
        
        # Return the JSON response
        return jsonify(monthly_aggregated.to_dict(orient='records'))
    
    except Exception as e:
        # Handle exceptions and return a JSON response with the error message
        return jsonify({"error": str(e)}), 500



@app.route('/minmax', methods=['GET'])
def get_minmax():
    try:
        # Ensure that the selected_wikiproject is set
        if not selected_wikiproject:
            return jsonify({"error": "No WikiProject selected"}), 400

        # Construct the CSV file name based on the selected Wikiproject
        csv_file_name = f"{selected_wikiproject}_merged.csv"
        
        # Check if the file exists
        if not os.path.exists(csv_file_name):
            return jsonify({"error": f"CSV file '{csv_file_name}' does not exist"}), 404
        
        # Read the CSV file
        df = pd.read_csv(csv_file_name)
        
        # Calculate the min and max values for the specified columns
        minmax_values = {
            'num_refs': [int(df['num_refs'].min()), int(df['num_refs'].max())],
            'num_media': [int(df['num_media'].min()), int(df['num_media'].max())],
            'num_wikilinks': [int(df['num_wikilinks'].min()), int(df['num_wikilinks'].max())],
            'num_categories': [int(df['num_categories'].min()), int(df['num_categories'].max())],
            'num_headings': [int(df['num_headings'].min()), int(df['num_headings'].max())],
            'page_length': [int(df['page_length'].min()), int(df['page_length'].max())],
            'pred_qual': [float(df['pred_qual'].min()), float(df['pred_qual'].max())]
        }
        return jsonify(minmax_values)
    
    except Exception as e:
        # Handle exceptions and return a JSON response with the error message
        return jsonify({"error": str(e)}), 500


@app.route('/filter', methods=['POST'])
def filter_data():
    try:
        # Ensure that the selected_wikiproject is set
        if not selected_wikiproject:
            return jsonify({"error": "No WikiProject selected"}), 400

        # Construct the CSV file name based on the selected Wikiproject
        csv_file_name = f"{selected_wikiproject}_merged.csv"
        
        # Check if the file exists
        if not os.path.exists(csv_file_name):
            return jsonify({"error": f"CSV file '{csv_file_name}' does not exist"}), 404
        
        # Read the CSV file
        df = pd.read_csv(csv_file_name)
        
        # Get the filters from the request
        filters = request.json
        
        # Filter the data based on the provided criteria
        filtered_data = df[
            (df['num_refs'] >= filters.get('num_refs_min', df['num_refs'].min())) &
            (df['num_refs'] <= filters.get('num_refs_max', df['num_refs'].max())) &
            (df['num_media'] >= filters.get('num_media_min', df['num_media'].min())) &
            (df['num_media'] <= filters.get('num_media_max', df['num_media'].max())) &
            (df['num_wikilinks'] >= filters.get('num_wikilinks_min', df['num_wikilinks'].min())) &
            (df['num_wikilinks'] <= filters.get('num_wikilinks_max', df['num_wikilinks'].max())) &
            (df['num_categories'] >= filters.get('num_categories_min', df['num_categories'].min())) &
            (df['num_categories'] <= filters.get('num_categories_max', df['num_categories'].max())) &
            (df['num_headings'] >= filters.get('num_headings_min', df['num_headings'].min())) &
            (df['num_headings'] <= filters.get('num_headings_max', df['num_headings'].max())) &
            (df['page_length'] >= filters.get('page_length_min', df['page_length'].min())) &
            (df['page_length'] <= filters.get('page_length_max', df['page_length'].max())) &
            (df['pred_qual'] >= filters.get('pred_qual_min', df['pred_qual'].min())) &
            (df['pred_qual'] <= filters.get('pred_qual_max', df['pred_qual'].max()))
        ]
        
        # Apply additional filters if provided
        if filters.get('quality_class'):
            filtered_data = filtered_data[filtered_data['quality_class'].isin(filters['quality_class'])]
        
        if filters.get('importance_class'):
            filtered_data = filtered_data[filtered_data['importance_class'].isin(filters['importance_class'])]
        
        # Return the filtered data as a JSON response
        return filtered_data.to_json(orient='records')
    
    except Exception as e:
        # Handle exceptions and return a JSON response with the error message
        return jsonify({"error": str(e)}), 500


# Function to download the CSV file
def download_csv(url, local_file_name):
    try:
        response = requests.get(url, verify=False)
        response.raise_for_status()
        with open(local_file_name, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded {local_file_name}")
    except Exception as e:
        print(f"Error downloading the file from {url}: {e}")
        return False
    return True



@app.route('/get_csv_data_monthly_Latest', methods=['GET'])
def get_csv_data_monthly_Latest():
    try:
        # Ensure that the selected_wikiproject is set
        if not selected_wikiproject:
            return jsonify({"error": "No WikiProject selected"}), 400

        # Construct the CSV file name based on the selected Wikiproject
        csv_file_name = f"{selected_wikiproject}_latest_monthly.csv"
        
        # Check if the file exists
        if not os.path.exists(csv_file_name):
            return jsonify({"error": f"CSV file '{csv_file_name}' does not exist"}), 404
        
        # Read the CSV file
        df2 = pd.read_csv(csv_file_name)
        
        # Return the data as JSON
        return jsonify(df2.to_dict(orient='records'))
    
    except Exception as e:
        # Handle exceptions and return a JSON response with the error message
        return jsonify({"error": str(e)}), 500


@app.route('/get_article_data', methods=['GET'])
def get_article_data():
    try:
        # Ensure that the selected_wikiproject is set
        if not selected_wikiproject:
            return jsonify({"error": "No WikiProject selected"}), 400

        # Construct the CSV file name based on the selected Wikiproject
        csv_file_name = f"{selected_wikiproject}_latest_monthly.csv"
        
        # Check if the file exists
        if not os.path.exists(csv_file_name):
            return jsonify({"error": f"CSV file '{csv_file_name}' does not exist"}), 404
        
        # Read the CSV file
        df = pd.read_csv(csv_file_name)
        print(df.columns)  # Print the columns to verify
        
        # Get the article ID from the request
        article_id = request.args.get('page_id')
        if not article_id:
            return jsonify({'error': 'No article ID provided'}), 400

        # Ensure that the 'page_id' column exists
        if 'page_id' not in df.columns:
            return jsonify({'error': 'page_id column not found'}), 400

        # Filter the dataframe to get the article data
        article_data = df[df['page_id'] == int(article_id)]
        
        if article_data.empty:
            return jsonify({'error': 'Article not found'}), 404
        
        # Return the article data as JSON
        return jsonify(article_data.to_dict(orient='records'))
    
    except Exception as e:
        # Handle exceptions and return a JSON response with the error message
        return jsonify({"error": str(e)}), 500


@app.route('/get_pageviews', methods=['GET'])
def get_pageviews():
    # Retrieve query parameters
    title = request.args.get('title')
    start = request.args.get('start')
    end = request.args.get('end')
    
    # Check for missing parameters
    if not title or not start or not end:
        return jsonify({'error': 'Missing required parameters'}), 400
    
    # Construct the URL for the Wikimedia API request
    url = f'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/{title}/daily/{start}/{end}'
    
    # Define the user agent
    contact_email = 'paragon@wikimedia.org'
    tutorial_label = 'PAWS Language-agnostic quality modeling tutorial (mwapi)'
    user_agent = f'<{contact_email}> {tutorial_label}'
    
    try:
        # Make the request to the Wikimedia API with the user agent
        response = requests.get(url, headers={'User-Agent': user_agent})
        
        # Check if the request was successful
        if response.status_code == 200:
            # Return the JSON response from the API
            return jsonify(response.json())
        else:
            # Return an error message if the API request failed
            return jsonify({'error': 'Failed to fetch data from Wikimedia API', 'status_code': response.status_code}), response.status_code
    
    except requests.exceptions.RequestException as e:
        # Handle any exceptions that occur during the request
        return jsonify({'error': 'An error occurred while fetching data from the Wikimedia API', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)