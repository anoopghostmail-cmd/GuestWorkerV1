/**
 * Centralized API configuration.
 *
 * STRATEGY: Use RELATIVE URLs by default ("/api/..."). Browsers ALWAYS treat relative
 * URLs as same-origin so NO CORS preflight is ever issued, regardless of access URL.
 *
 * Set REACT_APP_API_URL only if frontend and backend are intentionally on different origins.
 */

export const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Empty string => same-origin relative requests
  return '';
};

export const getApiUrl = () => {
  return `${getApiBaseUrl()}/api`;
};
