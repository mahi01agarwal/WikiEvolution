import pandas as pd
import requests
import os

# Function to construct the URL based on the user's input
def construct_url(base_url, wikiproject_name):
    file_name = f"{wikiproject_name}.csv"
    return f"{base_url}{file_name}"

# Function to download the CSV file
def download_csv(url, local_file_name):
    try:
        response = requests.get(url, verify=False)  # Disable SSL verification
        response.raise_for_status()  # Raise an error for bad status
        with open(local_file_name, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded {local_file_name}")
    except Exception as e:
        print(f"Error downloading the file from {url}: {e}")
        return False
    return True

# Function to perform the data transformations
def transform_data(df_revisions, df_pages, wikiproject_name):
    # Convert the timestamp format to 'YYYY-MM-DDTHH:MM:SSZ'
    df_revisions['revision_timestamp'] = pd.to_datetime(df_revisions['revision_timestamp']).dt.strftime('%Y-%m-%dT%H:%M:%SZ')
    
    # Merge the dataframes on 'page_id'
    df_merged = df_revisions.merge(df_pages, on='page_id')
    
    # Sort the merged dataframe and get the latest revisions
    sorted_df = df_merged.sort_values(by=['page_title', 'revision_timestamp'], ascending=[True, False])
    latest_revisions_df = sorted_df.groupby('page_title').first().reset_index()
    
    # Add a column for the Wikiproject name
    latest_revisions_df['wikiproject'] = wikiproject_name
    
    # Transform data to the desired format (matching the first dataset)
    transformed_df = latest_revisions_df[[
        'wiki_db', 'page_id', 'item_id', 'revision_id', 'revision_timestamp',
        'page_length', 'num_refs', 'num_wikilinks', 'num_categories', 'num_media', 
        'num_headings', 'pred_qual', 'page_title', 'quality_class', 'importance_class'
    ]]
    
    # Add an index column starting from 0
    transformed_df.insert(0, 'index', range(len(transformed_df)))
    
    return transformed_df

# Main function to execute the script
def main(selected_wikiproject):
    # Base URLs
    revisions_base_url = "https://analytics.wikimedia.org/published/datasets/outreachy-round-28/revisions/"
    assessments_base_url = "https://analytics.wikimedia.org/published/datasets/outreachy-round-28/assessments/"
    
    # Use the provided Wikiproject name
    wikiproject_name = selected_wikiproject
    
    # Remove the ".csv" extension from the input if provided
    if wikiproject_name.endswith(".csv"):
        wikiproject_name = wikiproject_name[:-4]
    
    # Construct the URLs and local file names
    revisions_url = construct_url(revisions_base_url, wikiproject_name)
    assessments_url = construct_url(assessments_base_url, wikiproject_name)
    revisions_file_name = f"{wikiproject_name}_revisions.csv"
    assessments_file_name = f"{wikiproject_name}_assessments.csv"
    
    # Download the CSV files
    if not download_csv(revisions_url, revisions_file_name):
        return
    if not download_csv(assessments_url, assessments_file_name):
        return
    
    # Read the CSV files
    try:
        df_revisions = pd.read_csv(revisions_file_name)
        df_pages = pd.read_csv(assessments_file_name)
    except Exception as e:
        print(f"Error reading the CSV files: {e}")
        return
    
    # Perform the data transformations
    transformed_df = transform_data(df_revisions, df_pages, wikiproject_name)
    
    # Save the transformed data to a CSV file
    merged_file_name = f"{wikiproject_name}_merged.csv"
    transformed_df.to_csv(merged_file_name, index=False)
    print(f"Saved merged data to {merged_file_name}")
    
    # Delete the downloaded CSV files
    try:
        os.remove(revisions_file_name)
        os.remove(assessments_file_name)
        print(f"Deleted {revisions_file_name} and {assessments_file_name}")
    except Exception as e:
        print(f"Error deleting the files: {e}")

if __name__ == "__main__":
    main()
