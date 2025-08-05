import { getDevelopmentServerURL, findBestServerURL } from '../utils/networkUtils';

// API Configuration for different environments
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

// Set this to change environments
const CURRENT_ENV = ENV.DEVELOPMENT;

// Dynamic API Base URLs - will be resolved at runtime
const API_URLS = {
  [ENV.DEVELOPMENT]: null, // Will be dynamically resolved
  [ENV.PRODUCTION]: 'https://your-deployed-backend.herokuapp.com', // Replace with your deployed URL
  [ENV.STAGING]: 'https://your-staging-backend.herokuapp.com', // Replace with your staging URL
};

// Firebase Configuration (Alternative backend)
const FIREBASE_CONFIG = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Cache for resolved URLs
let resolvedUrls = {};

/**
 * Get the current API base URL with dynamic resolution
 * @returns {Promise<string>} The resolved API base URL
 */
const getBaseUrl = async () => {
  const env = CURRENT_ENV;
  
  // If already resolved, return cached value
  if (resolvedUrls[env]) {
    return resolvedUrls[env];
  }

  let baseUrl;

  if (env === ENV.DEVELOPMENT) {
    // For development, dynamically find the best server
    console.log('🔍 Resolving development server URL...');
    baseUrl = await findBestServerURL();
    console.log('✅ Development server resolved:', baseUrl);
  } else {
    // For production/staging, use the configured URL
    baseUrl = API_URLS[env];
  }

  // Cache the resolved URL
  resolvedUrls[env] = baseUrl;
  return baseUrl;
};

/**
 * Get API endpoints with dynamic base URL resolution
 * @returns {Promise<Object>} API endpoints object
 */
export const getAPIEndpoints = async () => {
  const baseUrl = await getBaseUrl();
  
  return {
    BASE_URL: baseUrl,
    
    // Report endpoints
    SUBMIT_REPORT: `${baseUrl}/api/submit-report`,
    DASHBOARD: `${baseUrl}/api/dashboard`,
    UPDATE_STATUS: `${baseUrl}/api/update-status`,
    
    // Image endpoints
    GET_IMAGE: (reportId) => `${baseUrl}/api/requests/${reportId}/image`,
    
    // Health check
    HEALTH: `${baseUrl}/api/health`,
  };
};

// Legacy API_ENDPOINTS for backward compatibility
// This will be deprecated in favor of getAPIEndpoints()
export const API_ENDPOINTS = {
  BASE_URL: API_URLS[CURRENT_ENV] || 'http://localhost:5000', // Fallback
  
  // Report endpoints
  SUBMIT_REPORT: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/submit-report`,
  DASHBOARD: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/dashboard`,
  UPDATE_STATUS: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/update-status`,
  
  // Image endpoints
  GET_IMAGE: (reportId) => `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/requests/${reportId}/image`,
  
  // Health check
  HEALTH: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/health`,
};

// Environment info
export const ENVIRONMENT = {
  current: CURRENT_ENV,
  isDevelopment: CURRENT_ENV === ENV.DEVELOPMENT,
  isProduction: CURRENT_ENV === ENV.PRODUCTION,
  isStaging: CURRENT_ENV === ENV.STAGING,
};

// Firebase config for alternative backend
export { FIREBASE_CONFIG };

/**
 * Switch environment and clear URL cache
 * @param {string} newEnv - The new environment
 */
export const switchEnvironment = async (newEnv) => {
  if (Object.values(ENV).includes(newEnv)) {
    console.log(`🔄 Switching from ${CURRENT_ENV} to ${newEnv}`);
    
    // Clear resolved URLs cache
    resolvedUrls = {};
    
    // Update current environment (you might want to persist this)
    // CURRENT_ENV = newEnv; // Note: This would require restructuring
    
    console.log('✅ Environment switched, URL cache cleared');
  }
};

/**
 * Clear the URL cache (useful for network changes)
 */
export const clearURLCache = () => {
  resolvedUrls = {};
  console.log('🗑️ URL cache cleared');
};

/**
 * Get current network information
 * @returns {Promise<Object>} Network information
 */
export const getCurrentNetworkInfo = async () => {
  const { getNetworkInfo } = await import('../utils/networkUtils');
  return await getNetworkInfo();
};

export default API_ENDPOINTS; 