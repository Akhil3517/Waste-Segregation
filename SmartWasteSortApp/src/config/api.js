import { getDevelopmentServerURL, findBestServerURL } from '../utils/networkUtils';

// API Configuration for different environments
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

// Set this to change environments
const CURRENT_ENV = ENV.PRODUCTION;

// Dynamic API Base URLs - will be resolved at runtime
const API_URLS = {
  [ENV.DEVELOPMENT]: null, // Will be dynamically resolved
  [ENV.PRODUCTION]: 'https://waste-segregation-production.up.railway.app', // Railway deployment
  [ENV.STAGING]: 'https://your-staging-backend.herokuapp.com', // Replace with your staging URL
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
    baseUrl = await findBestServerURL();
  } else if (env === ENV.PRODUCTION) {
    // For production, use the static Railway URL directly
    baseUrl = API_URLS[env];
  } else {
    // For staging, use the configured URL
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
    
    // Waste detection endpoints
    WASTE_DETECTION: `${baseUrl}/api/mobile/detect`,
    GEMINI_CLASSIFICATION: `${baseUrl}/api/gemini-classify`,
    
    // Report endpoints
    SUBMIT_REPORT: `${baseUrl}/api/mobile/report-garbage`,
    DASHBOARD: `${baseUrl}/api/mobile/dashboard`,
    UPDATE_STATUS: `${baseUrl}/api/mobile/update-status`,
    
    // YouTube suggestions endpoint
    YOUTUBE_SUGGESTIONS: `${baseUrl}/api/youtube-suggestions`,
    
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
  
  // Waste detection endpoints
  WASTE_DETECTION: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/mobile/detect`,
  GEMINI_CLASSIFICATION: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/gemini-classify`,
  
  // Report endpoints
  SUBMIT_REPORT: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/mobile/report-garbage`,
  DASHBOARD: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/mobile/dashboard`,
  UPDATE_STATUS: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/mobile/update-status`,
  
  // YouTube suggestions endpoint
  YOUTUBE_SUGGESTIONS: `${API_URLS[CURRENT_ENV] || 'http://localhost:5000'}/api/youtube-suggestions`,
  
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

/**
 * Switch environment and clear URL cache
 * @param {string} newEnv - The new environment
 */
export const switchEnvironment = async (newEnv) => {
  if (Object.values(ENV).includes(newEnv)) {
    // Clear resolved URLs cache
    resolvedUrls = {};
    
    // Update current environment (you might want to persist this)
    // CURRENT_ENV = newEnv; // Note: This would require restructuring
  }
};

/**
 * Clear the URL cache (useful for network changes)
 */
export const clearURLCache = () => {
  resolvedUrls = {};
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