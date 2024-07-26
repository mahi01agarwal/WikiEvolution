import pandas as pd
import requests
import os

# Function to construct the URL based on the user's input
def construct_url(wikiproject_name):
    base_url = "https://analytics.wikimedia.org/published/datasets/outreachy-round-28/revisions/"
    file_name = f"{wikiproject_name}.csv"
    return f"{base_url}{file_name}"

# Function to download the CSV file
def download_csv(url, local_file_name):
    try:
        # Disable SSL verification
        response = requests.get(url, verify=False)
        response.raise_for_status()  # Raise an error for bad status
        with open(local_file_name, 'wb') as file:
            file.write(response.content)
        print(f"Downloaded {local_file_name}")
    except Exception as e:
        print(f"Error downloading the file from {url}: {e}")
        return False
    return True

# Function to perform the data transformations
def transform_data(df, wikiproject_name):
    df['revision_timestamp'] = pd.to_datetime(df['revision_timestamp'])
    df['year_month'] = df['revision_timestamp'].dt.to_period('M')
    
    latest_revisions_monthly = df.loc[df.groupby(['page_id', 'year_month'])['revision_id'].idxmax()]
    latest_revisions_monthly.reset_index(drop=True, inplace=True)
    
    page_date_ranges = latest_revisions_monthly.groupby('page_id').apply(
        lambda x: pd.DataFrame({'year_month': pd.period_range(start=x['year_month'].min(), end=x['year_month'].max(), freq='M')})
    ).reset_index(level=0)
    
    df_full = pd.merge(page_date_ranges, latest_revisions_monthly, on=['page_id', 'year_month'], how='left')
    df_full_fill = df_full.ffill(axis=0).fillna(pd.NA)
    
    df_full_fill['wikiproject_name'] = wikiproject_name
    return df_full_fill

# Function to save the transformed data to a single CSV file
def save_to_csv(df, file_name):
    if os.path.exists(file_name):
        df.to_csv(file_name, mode='a', header=False, index=False)
    else:
        df.to_csv(file_name, index=False)

# Main function to execute the script
def main():
    # Prompt the user for the Wikiproject name
    wikiproject_name = input("Enter the Wikiproject name: ")
    
    # Remove the ".csv" extension from the input if provided
    if wikiproject_name.endswith(".csv"):
        wikiproject_name = wikiproject_name[:-4]
    
    # Construct the URL and local file name
    csv_url = construct_url(wikiproject_name)
    local_file_name = f"{wikiproject_name}.csv"
    
    # Download the CSV file
    if not download_csv(csv_url, local_file_name):
        return
    
    # Read the CSV file
    try:
        df = pd.read_csv(local_file_name)
    except Exception as e:
        print(f"Error reading the CSV file from {local_file_name}: {e}")
        return
    
    # Perform the data transformations
    transformed_df = transform_data(df, wikiproject_name)
    
    # Save the transformed data to a single CSV file
    output_file_name = "All_Wikiprojects_Monthly_Latest_Revisions.csv"
    save_to_csv(transformed_df, output_file_name)
    print(f"Transformed data saved to {output_file_name}")
    
    # Delete the downloaded CSV file
    try:
        os.remove(local_file_name)
        print(f"Deleted {local_file_name}")
    except Exception as e:
        print(f"Error deleting the file {local_file_name}: {e}")

if __name__ == "__main__":
    main()
