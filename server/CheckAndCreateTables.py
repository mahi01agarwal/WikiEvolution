from connectModified import check_table_exists, create_tables, execute_query

def handle_wikiproject_selection(wikiproject_name):
    tables = [
        f"{wikiproject_name}_Table1_LatestRevisions",
        f"{wikiproject_name}_Table2_LatestRevisionsMonthly",
        f"{wikiproject_name}_Table3_LatestRevisionsMonthlyAggregatedMean",
        f"{wikiproject_name}_Table4_LatestRevisionsMonthlyAggregatedSum"
    ]
    
    tables_exist = all(check_table_exists(table) for table in tables)
    
    if tables_exist:
        print(f"Tables for {wikiproject_name} already exist. Fetching data...")
        # Add logic to fetch and display data
    else:
        print(f"Tables for {wikiproject_name} do not exist. Creating tables...")
        create_tables(wikiproject_name)

handle_wikiproject_selection("Caribbean")        