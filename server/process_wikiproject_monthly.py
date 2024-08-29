import pandas as pd
import requests
from io import StringIO

# Function to construct the URL based on the Wikiproject name
def construct_url(base_url, wikiproject_name):
    file_name = f"{wikiproject_name}.csv"
    return f"{base_url}{file_name}"

# Function to download the CSV file using requests and StringIO
def download_csv(url):
    try:
        # Make a GET request to fetch the raw CSV data
        response = requests.get(url, verify=False)  # Disable SSL verification
        response.raise_for_status()  # Raise an error for bad status codes

        # Use StringIO to convert the response text to a file-like object
        csv_data = StringIO(response.text)
        
        # Read the CSV data into a DataFrame
        df = pd.read_csv(csv_data)
        
        return df
    except Exception as e:
        print(f"Error downloading the file from {url}: {e}")
        return None

# Function to perform the data preprocessing
def fill_missing_months(df):
    # Ensure the revision_timestamp is in datetime format
    df['revision_timestamp'] = pd.to_datetime(df['revision_timestamp'])
    
    # Ensure the 'month' column is in the correct format 'YYYY-MM'
    df['month'] = df['revision_timestamp'].dt.to_period('M').astype(str)
    
    # Sort the data by page_id and revision_timestamp
    df = df.sort_values(by=['page_id', 'revision_timestamp'])
    
    # Generate a full range of months for each article
    all_months = pd.period_range(start=df['revision_timestamp'].min(), end=df['revision_timestamp'].max(), freq='M')
    
    # Create a new DataFrame that contains a row for every article and every month
    expanded_df = pd.DataFrame([
        (page_id, month) for page_id in df['page_id'].unique() for month in all_months
    ], columns=['page_id', 'month'])
    
    # Merge the original data with the expanded DataFrame
    df['month'] = df['month'].astype(str)
    expanded_df['month'] = expanded_df['month'].astype(str)
    df_filled = pd.merge(expanded_df, df, on=['page_id', 'month'], how='left')
    
    # Forward fill the missing values
    df_filled = df_filled.groupby('page_id').apply(lambda group: group.ffill().bfill())
    
    # Drop any remaining NaN values that couldn't be filled
    df_filled = df_filled.dropna()
    
    return df_filled

# Main function to execute the script
def main(selected_wikiproject):
    # Base URL for the revisions data
    base_url = "https://analytics.wikimedia.org/published/datasets/outreachy-round-28/revisions/"
    
    # Use the provided Wikiproject name
    wikiproject_name = selected_wikiproject
    
    # Remove the ".csv" extension from the input if provided
    if wikiproject_name.endswith(".csv"):
        wikiproject_name = wikiproject_name[:-4]
    
    # Construct the URL
    url = construct_url(base_url, wikiproject_name)
    
    # Download the CSV file
    print("Downloading the data...")
    df = download_csv(url)
    
    if df is None:
        print("Failed to download or load the data.")
        return
    
    # Preprocess the data to fill in missing months
    print("Processing the data...")
    df_processed = fill_missing_months(df)
    
    # Save the processed data to a CSV file
    output_file_name = f"{wikiproject_name}_latest_monthly.csv"
    df_processed.to_csv(output_file_name, index=False)
    print(f"Processed data saved to {output_file_name}")
