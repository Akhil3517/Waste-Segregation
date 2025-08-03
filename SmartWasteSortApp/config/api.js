// API Configuration for different environments
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging'
};

// Set this to change environments
const CURRENT_ENV = ENV.DEVELOPMENT;

// API Base URLs for different environments
const API_URLS = {
  [ENV.DEVELOPMENT]: 'http://192.168.0.101:5000',
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

// Get the current API base URL
const getBaseUrl = () => {
  return API_URLS[CURRENT_ENV];
};

// API Endpoints
export const API_ENDPOINTS = {
  BASE_URL: getBaseUrl(),
  
  // Report endpoints
  SUBMIT_REPORT: `${getBaseUrl()}/api/submit-report`,
  DASHBOARD: `${getBaseUrl()}/api/dashboard`,
  UPDATE_STATUS: `${getBaseUrl()}/api/update-status`,
  
  // Image endpoints
  GET_IMAGE: (reportId) => `${getBaseUrl()}/api/requests/${reportId}/image`,
  
  // Health check
  HEALTH: `${getBaseUrl()}/api/health`,
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

// Helper function to switch environments
export const switchEnvironment = (newEnv) => {
  if (Object.values(ENV).includes(newEnv)) {
    console.log(`Switching from ${CURRENT_ENV} to ${newEnv}`);
    // You can implement environment switching logic here
    // For now, you'll need to manually change CURRENT_ENV
  }
};

export default API_ENDPOINTS; 