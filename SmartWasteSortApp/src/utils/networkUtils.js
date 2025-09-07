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
      console.log('🌐 Using cached IP:', cachedLocalIP);
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
      console.log('⚠️ NetworkInfo failed, trying fallback methods...');
      
      // Try alternative methods
      try {
        localIP = await NetworkInfo.getIPAddress();
      } catch (error) {
        console.log('❌ NetworkInfo.getIPAddress failed:', error);
      }
    }

    // If still no IP, use common localhost addresses
    if (!localIP) {
      console.log('⚠️ No IP detected, using fallback localhost');
      localIP = '10.0.2.2'; // Android emulator default
    }

    // Cache the result
    cachedLocalIP = localIP;
    lastCacheTime = now;

    console.log('🌐 Detected local IP:', localIP);
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for faster response
    
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`⏰ Server timeout at ${url}`);
    } else {
      console.log(`❌ Server not reachable at ${url}:`, error.message);
    }
    return false;
  }
};

/**
 * Find the best available server URL
 * @returns {Promise<string>} The best available server URL
 */
export const findBestServerURL = async () => {
  try {
    // For mobile data compatibility, always try production first
    console.log('🌐 Checking network connectivity...');
    
    // Try production server first (works on any network)
    const productionUrl = 'https://waste-segregation-dz7r.onrender.com';
    const isProductionReachable = await testServerReachability(productionUrl);
    
    if (isProductionReachable) {
      console.log('✅ Production server is reachable');
      return productionUrl;
    }

    // If production fails, try local development servers
    const candidates = [
      await getDevelopmentServerURL(),
      'http://localhost:5000',
      'http://10.0.2.2:5000', // Android emulator
      'http://127.0.0.1:5000',
    ];

    console.log('🔍 Testing local server candidates:', candidates);

    for (const url of candidates) {
      const isReachable = await testServerReachability(url);
      if (isReachable) {
        console.log('✅ Found working local server:', url);
        return url;
      }
    }

    // If nothing works, return production as fallback
    console.log('⚠️ No servers reachable, using production as fallback');
    return productionUrl;
  } catch (error) {
    console.error('❌ Error in findBestServerURL:', error);
    // Always fallback to production server
    return 'https://waste-segregation-dz7r.onrender.com';
  }
};

/**
 * Clear the IP cache (useful for testing or network changes)
 */
export const clearIPCache = () => {
  cachedLocalIP = null;
  lastCacheTime = 0;
  console.log('🗑️ IP cache cleared');
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
    
    // Log network info for debugging
    console.log('📡 Network Info:', {
      ip: info.ip,
      ssid: info.ssid,
      bssid: info.bssid,
      gateway: info.gateway,
      subnet: info.subnet,
    });
    
    return info;
  } catch (error) {
    console.error('❌ Error getting network info:', error);
    // Return default values indicating mobile data
    return {
      ip: null,
      ssid: null,
      bssid: null,
      gateway: null,
      subnet: null,
    };
  }
}; 