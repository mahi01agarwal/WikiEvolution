import os
import requests
import pandas as pd
import sqlite3

# Directory to store SQLite databases
DB_DIR = 'data'
if not os.path.exists(DB_DIR):
    os.makedirs(DB_DIR)

wiki_projects_url = 'https://analytics.wikimedia.org/published/datasets/outreachy-round-28/revisions/'

def download_and_convert_to_sqlite(project_name):
    csv_url = f'{wiki_projects_url}{project_name}.csv'
    response = requests.get(csv_url)
    
    if response.status_code != 200:
        return {'error': f'Failed to download CSV for {project_name}'}

    # Save CSV to a temporary file
    csv_path = os.path.join(DB_DIR, f'{project_name}.csv')
    with open(csv_path, 'wb') as file:
        file.write(response.content)

    # Check if the CSV file is downloaded successfully
    if not os.path.exists(csv_path):
        return {'error': f'CSV file for {project_name} not found after download'}

    # Read CSV into DataFrame
    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        return {'error': f'Failed to read CSV for {project_name}. Error: {e}'}

    # Check if the DataFrame is empty
    if df.empty:
        return {'error': f'CSV file for {project_name} is empty'}

    # Convert DataFrame to SQLite
    db_path = os.path.join(DB_DIR, f'{project_name}.sqlite')
    try:
        conn = sqlite3.connect(db_path)
        df.to_sql('project_data', conn, if_exists='replace', index=False)
        conn.close()
    except Exception as e:
        return {'error': f'Failed to create SQLite database for {project_name}. Error: {e}'}

    # Check if the SQLite database is created successfully
    if not os.path.exists(db_path):
        return {'error': f'SQLite database for {project_name} not found after creation'}

    return {'success': f'Database for {project_name} created successfully'}

download_and_convert_to_sqlite("caribbean")

