export const APP_CONFIG = {
  name: 'Menu App',
  version: '1.0.0',
  apiUrl: process.env.API_URL || 'http://localhost:3000',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
};

export const THEME = {
  colors: {
    primary: '#007AFF',
    secondary: '#5856D6',
    background: '#FFFFFF',
    text: '#000000',
    error: '#FF3B30',
    success: '#34C759',
  },
}; 