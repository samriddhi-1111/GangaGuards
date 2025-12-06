"""
Location Helper for ML Service
Helps get location coordinates for garbage detection.
"""
import sys


def get_location_from_user():
    """
    Prompt user to enter location or use GPS.
    Returns: (lat, lng, location_text) tuple
    """
    print("\n📍 Location Setup for Garbage Detection")
    print("=" * 50)
    
    # Option 1: Manual input
    print("\n1. Enter location manually:")
    try:
        lat = float(input("   Latitude: ").strip())
        lng = float(input("   Longitude: ").strip())
        location_text = input("   Location name (optional): ").strip() or f"Location ({lat}, {lng})"
        
        return lat, lng, location_text
    except ValueError:
        print("   ❌ Invalid coordinates. Using defaults.")
    
    # Option 2: Use defaults (Assi Ghat, Varanasi)
    print("\n2. Using default location (Assi Ghat, Varanasi)")
    print("\n2. Using default location (Assi Ghat, Varanasi)")
    return 25.285217, 82.790942, "Assi Ghat, Varanasi"


def get_location_from_gps():
    """
    Attempt to get location from GPS using geocoder library.
    Requires: pip install geocoder
    """
    try:
        import geocoder
        
        print("🌍 Getting location from GPS...")
        g = geocoder.ip('me')
        
        if g.ok:
            lat = g.latlng[0]
            lng = g.latlng[1]
            location_text = g.address or f"GPS Location ({lat}, {lng})"
            
            print(f"   ✅ Found: {location_text}")
            print(f"   Coordinates: {lat}, {lng}")
            
            return lat, lng, location_text
        else:
            print("   ⚠️  Could not get GPS location. Using defaults.")
            return None, None, None
    except ImportError:
        print("   ⚠️  geocoder library not installed.")
        print("   💡 Install with: pip install geocoder")
        return None, None, None
    except Exception as e:
        print(f"   ❌ Error getting GPS location: {e}")
        return None, None, None


if __name__ == "__main__":
    print("Location Helper for GangaGuard ML Service\n")
    
    if len(sys.argv) > 1 and sys.argv[1] == "--gps":
        # Try GPS first
        lat, lng, location_text = get_location_from_gps()
        if lat is None:
            lat, lng, location_text = get_location_from_user()
    else:
        # Manual input
        lat, lng, location_text = get_location_from_user()
    
    print(f"\n✅ Location configured:")
    print(f"   Latitude: {lat}")
    print(f"   Longitude: {lng}")
    print(f"   Name: {location_text}")
    print(f"\n💡 Use these values when running video_detection.py:")
    print(f"   python video_detection.py {lat} {lng} \"{location_text}\"")

