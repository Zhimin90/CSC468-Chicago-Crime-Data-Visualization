from sodapy import Socrata
import geopandas
import pandas as pd
from dateutil.relativedelta import relativedelta
from datetime import timedelta, date
import numpy as np
from flask import Flask, send_from_directory
import csv
import json

#Directory for data files
ASSET_DIR = './Asset'

app = Flask(__name__, static_url_path='', static_folder='D3_Visualization')

with open(ASSET_DIR + '/wards.geojson', 'r') as f:
    wardsDict = json.load(f)

#Home endpoint
@app.route('/')
def home():
    return app.send_static_file('index.html')

#Border of wards endpoint
@app.route('/wards')
def getWards():
    return wardsDict

#Crime endpoint
@app.route('/crimes')
def getCrimes():
    dict = getUpdatedCrimeData()
    #print(dict)
    return dict


def getUpdatedCrimeData():
    # Unauthenticated client only works with public data sets. Note 'None'
    # in place of application token, and no username or password:
    client = Socrata("data.cityofchicago.org", None)

    # Example authenticated client (needed for non-public datasets):
    # client = Socrata(data.cityofchicago.org,
    #                  MyAppToken,
    #                  userame="user@example.com",
    #                  password="AFakePassword")

    # First 2000 results, returned as JSON from API / converted to Python list of
    # dictionaries by sodapy.
    results = client.get("ijzp-q8t2", order="date DESC", 
                         where="location_description IN ('RESIDENCE', 'STREET', 'APARTMENT', 'SIDEWALK', 'OTHER (SPECIFY)', 'PARKING LOT / GARAGE (NON RESIDENTIAL)') and primary_type IN ('BATTERY', 'THEFT', 'CRIMINAL DAMAGE', 'ASSAULT', 'DECEPTIVE PRACTICE', 'OTHER OFFENSE') and date > '{}'".format((date.today()+relativedelta(months=-6)).strftime('%Y-%m')+'-01'), limit=1000000)

    # Convert to pandas DataFrame
    results_df = pd.DataFrame.from_records(results)
    #print(results_df.location_description.value_counts()[:6].index)
    #results_df = results_df[results_df.location_description.isin(
    #    results_df.location_description.value_counts()[:6].index)]
        
    test_df = results_df
    xbound = (-87.9361, -87.5245)
    ybound = (41.6447, 42.023)

    test_df = test_df[test_df.latitude.notna()].sort_values(['date'], ascending=[0])
    
    test_df['date'] = pd.to_datetime(test_df['date'])
    #test_df['updated_on'] = pd.to_datetime(test_df['updated_on'])
    test_df['latitude'] = pd.to_numeric(test_df['latitude'])
    test_df['longitude'] = pd.to_numeric(test_df['longitude'])

    geo_price_map = test_df[['id', 'case_number', 'date', 'block', 'iucr', 'primary_type',
                        'description', 'location_description', 'arrest', 'domestic', 'beat',
                        'district', 'ward', 'community_area', 'fbi_code', 'x_coordinate',
                        'y_coordinate', 'year', 'updated_on', 'latitude', 'longitude',
                        'location']]

    filter1a = pd.to_numeric(geo_price_map['longitude']) > xbound[0]
    filter1b = pd.to_numeric(geo_price_map['longitude']) < xbound[1]
    filter1c = pd.to_numeric(geo_price_map['latitude']) > ybound[0]
    filter1d = pd.to_numeric(geo_price_map['latitude']) < ybound[1]

    geo_price_map = geo_price_map[filter1a & filter1b & filter1c & filter1d]

    #print("earliest query: ", min(crime_2020_gdf['date']))
    #serialize date first
    geo_price_map['date'] = geo_price_map['date'].dt.strftime(
        '%Y-%m-%dT%H:%M:%S')
    #crime_2020_gdf['updated_on'] = crime_2020_gdf['updated_on'].dt.strftime(
    #    '%Y-%m-%dT%H:%M:%S')

    crime_2020_gdf = geopandas.GeoDataFrame(
        geo_price_map, geometry=geopandas.points_from_xy(geo_price_map.longitude, geo_price_map.latitude))
    
    return crime_2020_gdf.to_json()
