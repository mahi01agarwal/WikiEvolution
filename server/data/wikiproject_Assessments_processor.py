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
def transform_data(df_revisions, df_pages):
    df_merged = df_revisions.merge(df_pages, on='page_id')
    sorted_df = df_merged.groupby('page_title').apply(lambda x: x.sort_values('revision_id')).reset_index(drop=True)
    latest_revisions_df = sorted_df.loc[sorted_df.groupby('page_title')['revision_timestamp'].idxmax()].reset_index(drop=True)
    return latest_revisions_df

# Function to save the transformed data to a CSV file
def save_to_csv(df, file_name):
    df.to_csv(file_name, index=False)

# Main function to execute the script
def main():
    # Base URLs
    revisions_base_url = "https://analytics.wikimedia.org/published/datasets/outreachy-round-28/revisions/"
    assessments_base_url = "https://analytics.wikimedia.org/published/datasets/outreachy-round-28/assessments/"
    
    # Prompt the user for the Wikiproject name
    wikiproject_name = input("Enter the Wikiproject name: ")
    
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
    transformed_df = transform_data(df_revisions, df_pages)
    
    # Save the transformed data to a new CSV file
    output_file_name = f"{wikiproject_name}_Latest_Revisions.csv"
    save_to_csv(transformed_df, output_file_name)
    print(f"Transformed data saved to {output_file_name}")
    
    # Delete the downloaded CSV files
    try:
        os.remove(revisions_file_name)
        os.remove(assessments_file_name)
        print(f"Deleted {revisions_file_name} and {assessments_file_name}")
    except Exception as e:
        print(f"Error deleting the files: {e}")

if __name__ == "__main__":
    main()
