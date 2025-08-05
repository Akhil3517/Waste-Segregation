import { Platform } from 'react-native';
import NetworkInfo from 'react-native-network-info';

// Cache for IP address to avoid repeated lookups
let cachedLocalIP = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get the local IP address dynamically
 * @returns {Promise<string>} The local IP address
 */
export const getLocalIPAddress = async () => {
  try {
    // Check cache first
    const now = Date.now();
    if (cachedLocalIP && (now - lastCacheTime) < CACHE_DURATION) {
      return cachedLocalIP;
    }

    let localIP = null;

    if (Platform.OS === 'android') {
      // For Android, get WiFi IP
      localIP = await NetworkInfo.getIPV4Address();
    } else if (Platform.OS === 'ios') {
      // For iOS, get WiFi IP
      localIP = await NetworkInfo.getIPV4Address();
    }

    // Fallback methods if NetworkInfo fails
    if (!localIP) {
      // Try alternative methods
      try {
        localIP = await NetworkInfo.getIPAddress();
      } catch (error) {
        // NetworkInfo.getIPAddress failed
      }
    }

    // If still no IP, use common localhost addresses
    if (!localIP) {
      localIP = '10.0.2.2'; // Android emulator default
    }

    // Cache the result
    cachedLocalIP = localIP;
    lastCacheTime = now;

    return localIP;

  } catch (error) {
    console.error('❌ Error getting local IP:', error);
    
    // Return fallback IPs based on platform
    if (Platform.OS === 'android') {
      return '10.0.2.2'; // Android emulator
    } else {
      return 'localhost'; // iOS simulator
    }
  }
};

/**
 * Get the development server URL with dynamic IP
 * @returns {Promise<string>} The development server URL
 */
export const getDevelopmentServerURL = async () => {
  const localIP = await getLocalIPAddress();
  return `http://${localIP}:5000`;
};

/**
 * Test if a server is reachable
 * @param {string} url - The URL to test
 * @returns {Promise<boolean>} True if reachable
 */
export const testServerReachability = async (url) => {
  try {
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Find the best available server URL
 * @returns {Promise<string>} The best available server URL
 */
export const findBestServerURL = async () => {
  const candidates = [
    // Try local development server first
    await getDevelopmentServerURL(),
    // Fallback to common localhost addresses
    'http://localhost:5000',
    'http://10.0.2.2:5000', // Android emulator
    'http://127.0.0.1:5000',
  ];

  for (const url of candidates) {
    const isReachable = await testServerReachability(url);
    if (isReachable) {
      return url;
    }
  }

  // If no local server is reachable, return the first candidate
  return candidates[0];
};

/**
 * Clear the IP cache (useful for testing or network changes)
 */
export const clearIPCache = () => {
  cachedLocalIP = null;
  lastCacheTime = 0;
};

/**
 * Get network information
 * @returns {Promise<Object>} Network information
 */
export const getNetworkInfo = async () => {
  try {
    const info = {
      ip: await NetworkInfo.getIPV4Address(),
      ssid: await NetworkInfo.getSSID(),
      bssid: await NetworkInfo.getBSSID(),
      gateway: await NetworkInfo.getGatewayIPAddress(),
      subnet: await NetworkInfo.getSubnet(),
    };
    return info;
  } catch (error) {
    console.error('❌ Error getting network info:', error);
    return null;
  }
}; 