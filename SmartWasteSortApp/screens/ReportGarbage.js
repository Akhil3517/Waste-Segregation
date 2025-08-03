import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, Image, Alert, ActivityIndicator, ScrollView, TextInput, PermissionsAndroid, Linking, NetInfo } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { API_ENDPOINTS } from '../config/api';

const ReportGarbage = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [locationTimestamp, setLocationTimestamp] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [locationMethod, setLocationMethod] = useState(''); // GPS, Network, Cached, IP

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      console.log('Requesting location permission...');
      
      // Check if permission is already granted
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      
      if (checkResult) {
        console.log('Location permission already granted');
        setHasLocationPermission(true);
        return;
      }
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to report garbage locations accurately.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      console.log('Permission result:', granted);
      
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        setHasLocationPermission(true);
        console.log('Location permission granted');
      } else {
        console.log('Location permission denied');
        setHasLocationPermission(false);
      }
    } catch (err) {
      console.error('Error requesting location permission:', err);
      setHasLocationPermission(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const takePhoto = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const uploadPhoto = async () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Check permission first
      if (!hasLocationPermission) {
        console.log('Requesting location permission...');
        await requestLocationPermission();
        // Wait a bit for permission to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Check if we still don't have permission
      if (!hasLocationPermission) {
        Alert.alert(
          'Location Permission Required', 
          'Please grant location permission in your device settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      setIsGettingLocation(true);
      setLocation('Getting location...');
      console.log('Getting current location...');
      
      // Try multiple strategies like the frontend
      await tryLocationStrategies();
      
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
      Alert.alert('Error', 'Failed to get location. Please enter location manually.');
      setIsGettingLocation(false);
    }
  };

  const tryLocationStrategies = async () => {
    const strategies = [
      {
        name: 'Cached Location (Fastest)',
        options: { enableHighAccuracy: false, timeout: 3000, maximumAge: 300000 }
      },
      {
        name: 'Network Location (Fast)',
        options: { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      },
      {
        name: 'High Accuracy GPS (Slow)',
        options: { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
      }
    ];

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      console.log(`Trying strategy ${i + 1}: ${strategy.name}`);
      
      try {
        const result = await tryGetLocation(strategy.options);
        if (result) {
          console.log(`Strategy ${strategy.name} succeeded:`, result);
          return;
        }
      } catch (error) {
        console.log(`${strategy.name} failed:`, error);
        if (i === strategies.length - 1) {
          // All strategies failed - use a mock location for testing
          console.log('All strategies failed, using mock location for testing');
          const mockLocation = 'Test Location\n📍 40.7128, -74.0060';
          setLocation(mockLocation);
          setCoordinates({ latitude: 40.7128, longitude: -74.0060 });
          setLocationAccuracy('Unknown');
          setLocationMethod('Mock');
          setIsGettingLocation(false);
        }
      }
    }
  };

  const tryGetLocation = (options) => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log('Location obtained:', { latitude, longitude, accuracy });
          
          try {
            // Test exact location name first
            console.log('=== TESTING EXACT LOCATION ===');
            await testExactLocation(latitude, longitude);
            console.log('=== END TEST ===');
            
            // Try to get real address first
            const realAddress = await getRealAddress(latitude, longitude);
            const locationText = `${realAddress}\n📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            setLocation(locationText);
            setCoordinates({ latitude, longitude });
            setLocationAccuracy(accuracy ? `${Math.round(accuracy)}m` : 'Unknown');
            setLocationMethod('GPS');
            setIsGettingLocation(false);
            
            console.log('Location set with real address:', locationText);
            resolve(locationText);
          } catch (error) {
            console.log('Real address failed, using fallback:', error);
            // Fallback to simple location name
            const locationName = getLocationName(latitude, longitude);
            const locationText = `${locationName}\n📍 ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            
            setLocation(locationText);
            setCoordinates({ latitude, longitude });
            setLocationAccuracy(accuracy ? `${Math.round(accuracy)}m` : 'Unknown');
            setLocationMethod('GPS');
            setIsGettingLocation(false);
            
            console.log('Location set with fallback:', locationText);
            resolve(locationText);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          reject(error);
        },
        options
      );
    });
  };

  const getLocationName = (latitude, longitude) => {
    // More comprehensive location name based on coordinates
    const latAbs = Math.abs(latitude);
    const lonAbs = Math.abs(longitude);
    
    // Major US Cities with more precise ranges
    if (latAbs >= 40.7 && latAbs <= 40.8 && lonAbs >= 74.0 && lonAbs <= 74.1) {
      return 'Manhattan, New York';
    } else if (latAbs >= 40.6 && latAbs <= 40.9 && lonAbs >= 73.8 && lonAbs <= 74.2) {
      return 'New York City';
    } else if (latAbs >= 34.0 && latAbs <= 34.2 && lonAbs >= 118.2 && lonAbs <= 118.4) {
      return 'Downtown Los Angeles';
    } else if (latAbs >= 34.0 && latAbs <= 34.3 && lonAbs >= 118.0 && lonAbs <= 118.5) {
      return 'Los Angeles';
    } else if (latAbs >= 41.8 && latAbs <= 42.0 && lonAbs >= 87.6 && lonAbs <= 87.7) {
      return 'Downtown Chicago';
    } else if (latAbs >= 41.7 && latAbs <= 42.1 && lonAbs >= 87.5 && lonAbs <= 87.8) {
      return 'Chicago';
    } else if (latAbs >= 29.7 && latAbs <= 29.8 && lonAbs >= 95.3 && lonAbs <= 95.4) {
      return 'Downtown Houston';
    } else if (latAbs >= 29.6 && latAbs <= 29.9 && lonAbs >= 95.2 && lonAbs <= 95.5) {
      return 'Houston';
    } else if (latAbs >= 25.7 && latAbs <= 25.8 && lonAbs >= 80.2 && lonAbs <= 80.3) {
      return 'Downtown Miami';
    } else if (latAbs >= 25.6 && latAbs <= 25.9 && lonAbs >= 80.1 && lonAbs <= 80.4) {
      return 'Miami';
    } else if (latAbs >= 37.7 && latAbs <= 37.8 && lonAbs >= 122.4 && lonAbs <= 122.5) {
      return 'San Francisco';
    } else if (latAbs >= 32.7 && latAbs <= 32.8 && lonAbs >= 117.1 && lonAbs <= 117.2) {
      return 'San Diego';
    } else if (latAbs >= 33.7 && latAbs <= 33.8 && lonAbs >= 84.3 && lonAbs <= 84.4) {
      return 'Atlanta';
    } else if (latAbs >= 39.9 && latAbs <= 40.0 && lonAbs >= 75.1 && lonAbs <= 75.2) {
      return 'Philadelphia';
    } else if (latAbs >= 42.3 && latAbs <= 42.4 && lonAbs >= 71.0 && lonAbs <= 71.1) {
      return 'Boston';
    } else if (latAbs >= 38.9 && latAbs <= 39.0 && lonAbs >= 77.0 && lonAbs <= 77.1) {
      return 'Washington DC';
    } else if (latAbs >= 47.6 && latAbs <= 47.7 && lonAbs >= 122.3 && lonAbs <= 122.4) {
      return 'Seattle';
    } else if (latAbs >= 39.7 && latAbs <= 39.8 && lonAbs >= 105.0 && lonAbs <= 105.1) {
      return 'Denver';
    } else if (latAbs >= 29.4 && latAbs <= 29.5 && lonAbs >= 98.4 && lonAbs <= 98.5) {
      return 'San Antonio';
    } else if (latAbs >= 33.4 && latAbs <= 33.5 && lonAbs >= 112.0 && lonAbs <= 112.1) {
      return 'Phoenix';
    } else if (latAbs >= 39.1 && latAbs <= 39.2 && lonAbs >= 84.5 && lonAbs <= 84.6) {
      return 'Cincinnati';
    } else if (latAbs >= 35.2 && latAbs <= 35.3 && lonAbs >= 80.8 && lonAbs <= 80.9) {
      return 'Charlotte';
    } else if (latAbs >= 36.1 && latAbs <= 36.2 && lonAbs >= 115.1 && lonAbs <= 115.2) {
      return 'Las Vegas';
    } else if (latAbs >= 30.2 && latAbs <= 30.3 && lonAbs >= 97.7 && lonAbs <= 97.8) {
      return 'Austin';
    } else if (latAbs >= 27.9 && latAbs <= 28.0 && lonAbs >= 82.4 && lonAbs <= 82.5) {
      return 'Tampa';
    } else if (latAbs >= 39.9 && latAbs <= 40.0 && lonAbs >= 82.9 && lonAbs <= 83.0) {
      return 'Columbus';
    } else if (latAbs >= 42.3 && latAbs <= 42.4 && lonAbs >= 83.0 && lonAbs <= 83.1) {
      return 'Detroit';
    } else if (latAbs >= 44.9 && latAbs <= 45.0 && lonAbs >= 93.2 && lonAbs <= 93.3) {
      return 'Minneapolis';
    } else if (latAbs >= 38.6 && latAbs <= 38.7 && lonAbs >= 90.2 && lonAbs <= 90.3) {
      return 'St. Louis';
    } else if (latAbs >= 35.4 && latAbs <= 35.5 && lonAbs <= 97.4 && lonAbs <= 97.5) {
      return 'Oklahoma City';
    } else if (latAbs >= 35.1 && latAbs <= 35.2 && lonAbs >= 90.0 && lonAbs <= 90.1) {
      return 'Memphis';
    } else if (latAbs >= 36.7 && latAbs <= 36.8 && lonAbs >= 76.2 && lonAbs <= 76.3) {
      return 'Norfolk';
    } else if (latAbs >= 32.7 && latAbs <= 32.8 && lonAbs >= 117.1 && lonAbs <= 117.2) {
      return 'San Diego';
    } else if (latAbs >= 37.3 && latAbs <= 37.4 && lonAbs >= 121.8 && lonAbs <= 121.9) {
      return 'San Jose';
    } else if (latAbs >= 37.8 && latAbs <= 37.9 && lonAbs >= 122.4 && lonAbs <= 122.5) {
      return 'Oakland';
    } else if (latAbs >= 34.0 && latAbs <= 34.1 && lonAbs >= 118.2 && lonAbs <= 118.3) {
      return 'Hollywood, LA';
    } else if (latAbs >= 40.7 && latAbs <= 40.8 && lonAbs >= 73.9 && lonAbs <= 74.0) {
      return 'Brooklyn, NY';
    } else if (latAbs >= 40.7 && latAbs <= 40.8 && lonAbs >= 73.8 && lonAbs <= 73.9) {
      return 'Queens, NY';
    } else if (latAbs >= 40.8 && latAbs <= 40.9 && lonAbs >= 73.9 && lonAbs <= 74.0) {
      return 'Bronx, NY';
    } else if (latAbs >= 40.5 && latAbs <= 40.6 && lonAbs >= 74.0 && lonAbs <= 74.1) {
      return 'Staten Island, NY';
    } else {
      // For other locations, create a more descriptive name
      const region = getRegionName(latAbs, lonAbs);
      const cityType = getCityType(latAbs, lonAbs);
      return `${cityType}, ${region}`;
    }
  };

  const getRegionName = (latitude, longitude) => {
    // Determine region based on coordinates
    if (latitude >= 25 && latitude <= 50 && longitude >= -125 && longitude <= -65) {
      return 'United States';
    } else if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
      return 'Europe';
    } else if (latitude >= 10 && latitude <= 55 && longitude >= 30 && longitude <= 180) {
      return 'Asia';
    } else if (latitude >= -35 && latitude <= 35 && longitude >= -20 && longitude <= 50) {
      return 'Africa';
    } else if (latitude >= -60 && latitude <= 15 && longitude >= -90 && longitude <= -30) {
      return 'South America';
    } else if (latitude >= -45 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
      return 'Australia';
    } else {
      return 'Global';
    }
  };

  const getCityType = (latitude, longitude) => {
    // Determine city type based on coordinates
    const cityTypes = ['City', 'Town', 'Village', 'District', 'Area', 'Region'];
    const index = Math.floor((latitude + longitude) * 1000) % cityTypes.length;
    return cityTypes[index];
  };

  const getRealAddress = async (latitude, longitude) => {
    try {
      console.log('Getting real address for:', latitude, longitude);
      
      // Use Leaflet-compatible OpenStreetMap Nominatim API (completely free)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=en&extratags=1`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartWasteSortApp/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Nominatim API failed');
      }
      
      const data = await response.json();
      console.log('Nominatim response:', data);
      
      if (data && data.display_name) {
        // Extract the most relevant parts for a clean address
        const addressParts = data.display_name.split(', ');
        
        // Build a clean address based on available data
        let cleanAddress = '';
        
        if (data.address) {
          // Use structured address data if available
          const addr = data.address;
          let parts = [];
          
          if (addr.house_number && addr.road) {
            parts.push(`${addr.house_number} ${addr.road}`);
          } else if (addr.road) {
            parts.push(addr.road);
          }
          
          if (addr.suburb) parts.push(addr.suburb);
          if (addr.city) parts.push(addr.city);
          if (addr.state) parts.push(addr.state);
          
          if (parts.length > 0) {
            cleanAddress = parts.join(', ');
          }
        }
        
        // If structured data didn't work, use display_name
        if (!cleanAddress) {
          if (addressParts.length >= 4) {
            cleanAddress = addressParts.slice(0, 4).join(', ');
          } else if (addressParts.length >= 3) {
            cleanAddress = addressParts.slice(0, 3).join(', ');
          } else if (addressParts.length >= 2) {
            cleanAddress = addressParts.slice(0, 2).join(', ');
          } else {
            cleanAddress = addressParts[0];
          }
        }
        
        console.log('Clean address from Nominatim:', cleanAddress);
        return cleanAddress;
      } else {
        throw new Error('No address data received');
      }
      
    } catch (error) {
      console.error('Nominatim lookup failed:', error);
      
      // Fallback to BigDataCloud (also free)
      try {
        console.log('Trying BigDataCloud fallback...');
        const bigDataUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
        
        const bigDataResponse = await fetch(bigDataUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (bigDataResponse.ok) {
          const bigDataData = await bigDataResponse.json();
          console.log('BigDataCloud fallback response:', bigDataData);
          
          if (bigDataData && bigDataData.locality) {
            let addressParts = [];
            if (bigDataData.street) addressParts.push(bigDataData.street);
            if (bigDataData.locality) addressParts.push(bigDataData.locality);
            if (bigDataData.principalSubdivision) addressParts.push(bigDataData.principalSubdivision);
            
            if (addressParts.length === 0) {
              if (bigDataData.locality) addressParts.push(bigDataData.locality);
              if (bigDataData.principalSubdivision) addressParts.push(bigDataData.principalSubdivision);
              if (bigDataData.countryName) addressParts.push(bigDataData.countryName);
            }
            
            const cleanAddress = addressParts.join(', ');
            console.log('Clean address from BigDataCloud:', cleanAddress);
            return cleanAddress;
          }
        }
      } catch (fallbackError) {
        console.error('BigDataCloud fallback also failed:', fallbackError);
      }
      
      throw error; // Re-throw to trigger final fallback
    }
  };

  // Test function to get exact location name for any coordinates
  const testExactLocation = async (latitude, longitude) => {
    try {
      console.log(`Testing exact location for: ${latitude}, ${longitude}`);
      
      // Get the real address
      const realAddress = await getRealAddress(latitude, longitude);
      console.log('EXACT LOCATION NAME:', realAddress);
      
      // Also show the full response for debugging
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartWasteSortApp/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('FULL ADDRESS DATA:', data.display_name);
        console.log('ADDRESS COMPONENTS:', data.address);
      }
      
      return realAddress;
    } catch (error) {
      console.error('Test location failed:', error);
      return 'Location lookup failed';
    }
  };



  const getIPBasedLocation = async () => {
    try {
      console.log('Attempting IP-based location...');
      
      // Check network connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        console.log('No internet connection for IP-based location');
        return null;
      }
      
      // Use a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartWasteSortApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.log('IP geolocation service failed');
        return null;
      }
      
      const data = await response.json();
      console.log('IP geolocation response:', data);
      
      if (data.latitude && data.longitude) {
        const address = `${data.city || 'Unknown City'}, ${data.region || 'Unknown Region'}, ${data.country_name || 'Unknown Country'}`;
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          address: address
        };
      }
      
      return null;
    } catch (error) {
      console.error('IP-based location error:', error);
      return null;
    }
  };

  const createSimpleLocation = (latitude, longitude) => {
    // Create a simple, readable location format without internet
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(latitude);
    const lonAbs = Math.abs(longitude);
    
    // Format: "40.7128°N, 74.0060°W (GPS Coordinates)"
    return `${latAbs.toFixed(4)}°${latDir}, ${lonAbs.toFixed(4)}°${lonDir} (GPS Coordinates)`;
  };





  const checkNetworkConnectivity = async () => {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected && state.isInternetReachable;
    } catch (error) {
      console.log('Network check failed:', error);
      return false;
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      console.log('Attempting reverse geocoding for:', latitude, longitude);
      
      // Check network connectivity first
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        console.log('No internet connection, using offline location format');
        return createSimpleLocation(latitude, longitude);
      }
      
      // Use OpenStreetMap Nominatim for reverse geocoding
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1&accept-language=en`;
      
      console.log('Requesting address from Nominatim...');
      
      const response = await fetch(nominatimUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SmartWasteSortApp/1.0'
        }
      });
      
      if (!response.ok) {
        console.log('Nominatim request failed with status:', response.status);
        return createSimpleLocation(latitude, longitude);
      }
      
      const data = await response.json();
      console.log('Nominatim response:', data);
      
      if (data.display_name) {
        // Simple address format - just use the display name
        const addressParts = data.display_name.split(', ');
        const shortAddress = addressParts.slice(0, 3).join(', '); // Take first 3 parts
        
        // Add GPS coordinates for precision
        const gpsCoords = createSimpleLocation(latitude, longitude).replace(' (GPS Coordinates)', '');
        const finalAddress = `${shortAddress}\n📍 ${gpsCoords}`;
        
        console.log('Successfully obtained address:', finalAddress);
        return finalAddress;
      }
      
      // If no display_name, fallback to coordinates
      console.log('No address data in response, using coordinates');
      return createSimpleLocation(latitude, longitude);
      
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Return a simple coordinate-based location
      return createSimpleLocation(latitude, longitude);
    }
  };

  const submitReport = async () => {
    if (!selectedImage) {
      Alert.alert('Photo Required', 'Please add a photo of the garbage.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide a description of the garbage.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Location Required', 'Please add the location of the garbage.');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: selectedImage,
        type: 'image/jpeg',
        name: 'garbage_report.jpg',
      });
      formData.append('description', description);
      formData.append('location', location);
      
      // Use stored coordinates or extract from location string
      let latitude = coordinates.latitude || 0;
      let longitude = coordinates.longitude || 0;
      
      // If no stored coordinates, try to extract from location string
      if (latitude === 0 && longitude === 0 && location) {
        const coordsMatch = location.match(/Lat: ([\d.-]+), Long: ([\d.-]+)/);
        if (coordsMatch) {
          latitude = parseFloat(coordsMatch[1]);
          longitude = parseFloat(coordsMatch[2]);
          console.log('Extracted coordinates from location string:', latitude, longitude);
        }
      }
      
      console.log('Final coordinates being sent:', latitude, longitude);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());

      console.log('Sending report to:', API_ENDPOINTS.REPORT_GARBAGE);
      
      const response = await fetch(API_ENDPOINTS.REPORT_GARBAGE, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.success) {
        Alert.alert(
          'Report Submitted!', 
          data.message || 'Your garbage report has been submitted successfully.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSelectedImage(null);
                setDescription('');
                setLocation('');
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setDescription('');
    setLocation('');
    setCoordinates({ latitude: 0, longitude: 0 });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Garbage</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsTitle}>Report garbage location</Text>
          <Text style={styles.instructionsText}>
            Take a photo, add description and location to report garbage for cleanup
          </Text>
        </View>

        {/* Photo Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
          <View style={styles.imageSection}>
            {selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <View style={styles.placeholderCorners}>
                  <View style={styles.corner} />
                  <View style={styles.corner} />
                  <View style={styles.corner} />
                  <View style={styles.corner} />
                </View>
                <Text style={styles.placeholderText}>No photo selected</Text>
              </View>
            )}
          </View>
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.takePhotoButton} onPress={takePhoto}>
              <Feather name="camera" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadPhotoButton} onPress={uploadPhoto}>
              <Feather name="upload" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Describe the garbage (e.g., plastic bottles, food waste, etc.)"
            placeholderTextColor="#666666"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

                 {/* Location Section */}
         <View style={styles.section}>
           <Text style={styles.sectionTitle}>Location</Text>
           <View style={styles.locationContainer}>
             <View style={styles.locationInputContainer}>
               <TextInput
                 style={styles.locationInput}
                 placeholder="Enter location or use current location"
                 placeholderTextColor="#666666"
                 value={location}
                 onChangeText={setLocation}
                 multiline
                 numberOfLines={3}
                 textAlignVertical="top"
               />
             </View>
             <TouchableOpacity 
               style={[styles.locationButton, isGettingLocation && styles.disabledButton]} 
               onPress={getCurrentLocation}
               disabled={isGettingLocation}
             >
               {isGettingLocation ? (
                 <ActivityIndicator size="small" color="#FFFFFF" />
               ) : (
                 <Feather name="map-pin" size={20} color="#FFFFFF" />
               )}
             </TouchableOpacity>
           </View>
           {!hasLocationPermission && (
             <Text style={styles.locationHelpText}>
               💡 Location permission required. Tap the location button to enable.
             </Text>
           )}
                       {location && (
              <View style={styles.locationStatus}>
                <Feather 
                  name={location.includes('GPS Coordinates') ? 'map-pin' : 'check-circle'} 
                  size={16} 
                  color={location.includes('GPS Coordinates') ? '#f59e0b' : '#10b981'} 
                />
                <Text style={styles.locationStatusText}>
                  {location.includes('GPS Coordinates') 
                    ? '📍 GPS coordinates obtained (offline mode)' 
                    : '✅ Full address with GPS coordinates'
                  }
                  {locationMethod && ` • ${locationMethod}`}
                  {locationAccuracy && ` • Accuracy: ${locationAccuracy}`}
                </Text>
              </View>
            )}
         </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.submitButton, isLoading && styles.disabledButton]} 
            onPress={submitReport}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Submitting...' : 'Submit Report'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  imageSection: {
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  placeholderCorners: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#666666',
    borderWidth: 2,
  },
  placeholderText: {
    color: '#666666',
    fontSize: 16,
    marginTop: 80,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  takePhotoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  uploadPhotoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  locationInputContainer: {
    flex: 1,
  },
  locationInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    backgroundColor: '#f59e0b',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    height: 48,
    alignSelf: 'flex-start',
  },
  locationHelpText: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 8,
    fontStyle: 'italic',
  },
   locationStatus: {
     flexDirection: 'row',
     alignItems: 'center',
     marginTop: 8,
     gap: 8,
   },
   locationStatusText: {
     fontSize: 12,
     color: '#CCCCCC',
     fontStyle: 'italic',
   },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6b7280',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#6b7280',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportGarbage; 