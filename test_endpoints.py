import requests

def test_endpoints():
    base_url = "http://127.0.0.1:5000/api/v1"
    try:
        print("Testing /dashboard/summary...")
        res = requests.get(f"{base_url}/dashboard/summary")
        print(res.json())
        
        print("\nTesting /analytics/ndvi...")
        res = requests.get(f"{base_url}/analytics/ndvi")
        data = res.json()
        print(f"Keys: {data.keys()}")
        print(f"Sample expected_ndvi: {data.get('expected_ndvi')[:3]}")
        print(f"Sample statuses: {data.get('anomaly_status')[-3:]}")
        
        print("\nTesting /analytics/deep...")
        res = requests.get(f"{base_url}/analytics/deep")
        print(res.json().get('overall_health'))
        
        print("\nTesting /map/regions...")
        res = requests.get(f"{base_url}/map/regions")
        print([r['id'] for r in res.json().get('regions', [])])
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoints()
