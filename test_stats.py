import requests
import json

def test_stats_endpoint():
    """Test the stats endpoint to see if it's working"""
    try:
        # Test the stats endpoint
        response = requests.get('http://localhost:5000/api/stats')
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Stats endpoint is working!")
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        else:
            print(f"❌ Stats endpoint returned error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure it's running on localhost:5000")
    except Exception as e:
        print(f"❌ Error testing stats endpoint: {e}")

if __name__ == "__main__":
    test_stats_endpoint()
