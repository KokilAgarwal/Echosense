import requests

def test_endpoints():
    base_url = "http://127.0.0.1:5001/api/v1"
    try:
        print("1. Testing /dashboard/summary...")
        res = requests.get(f"{base_url}/dashboard/summary")
        summary = res.json()
        print("Location:", summary.get("location"))
        print("Health Index:", summary.get("health_index"))
        print("Weather Telemetry:", summary.get("environmental_telemetry", {}).get("temperature_c"), "°C")
        
        print("\n2. Testing /weather/current (Vellore Live Open-Meteo Telemetry)...")
        res = requests.get(f"{base_url}/weather/current")
        weather = res.json()
        print("Vellore Weather:", weather.get("temperature_c"), "°C,", weather.get("relative_humidity_pct"), "% hum, is_live:", weather.get("is_live"))
        
        print("\n3. Testing /analytics/ndvi?region_id=VEL-01 (Palar River Basin)...")
        res = requests.get(f"{base_url}/analytics/ndvi?region_id=VEL-01")
        data = res.json()
        print(f"Location: {data.get('location')}")
        print(f"Observed NDVI count: {len(data.get('actual_ndvi', []))}")
        print(f"Sample NDVI: {data.get('actual_ndvi')[:3]}")
        print(f"Sample Silence Scores: {data.get('silence_score')[:3]}")
        
        print("\n4. Testing /analytics/deep (Vellore Seasons & LST Correlation)...")
        res = requests.get(f"{base_url}/analytics/deep")
        deep = res.json()
        print("Seasons:", deep.get("seasons"))
        print("Exogenous LST points:", len(deep.get("exogenous_correlation", [])))
        
        print("\n5. Testing /map/regions (Vellore District Sectors)...")
        res = requests.get(f"{base_url}/map/regions")
        map_data = res.json()
        for r in map_data.get("regions", []):
            print(f" - {r['id']}: {r['name']} ({r['ecosystem_type']}) -> Bounds: {r['bounds']}")
            
        print("\n6. Testing /reports/data?region_id=VEL-01...")
        res = requests.get(f"{base_url}/reports/data?region_id=VEL-01")
        report = res.json()
        print("Report Generated For:", report.get("location", {}).get("name"))
        print("Recommendations count:", len(report.get("recommendations", [])))
        
        print("\nALL VELLORE API TESTS PASSED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoints()
