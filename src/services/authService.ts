import AsyncStorage from '@react-native-async-storage/async-storage';

// When testing on a physical device, use your computer's local IP address
const API_URL = 'http://192.168.1.144:3000'; // Your computer's local IP address

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  restaurants: string[];
  isVerified: boolean;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export const authService = {
  async register(data: RegistrationData): Promise<{ user: User; token: string }> {
    try {
      console.log('Attempting registration with:', data.email);
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Registration failed:', error);
        throw new Error(error.message || 'Registration failed');
      }

      const responseData = await response.json();
      console.log('Registration successful');
      await AsyncStorage.setItem('token', responseData.token);
      await AsyncStorage.setItem('user', JSON.stringify(responseData.user));

      return responseData;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    try {
      console.log('Attempting login with:', credentials.email);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Login failed:', error);
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login successful');
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('user', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  },

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('token');
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  async forgotPassword(email: string): Promise<void> {
    try {
      console.log('Requesting password reset for:', email);
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Password reset request failed:', error);
        throw new Error(error.message || 'Password reset request failed');
      }

      console.log('Password reset email sent');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      console.log('Resetting password');
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Password reset failed:', error);
        throw new Error(error.message || 'Password reset failed');
      }

      console.log('Password reset successful');
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  async verifyEmail(token: string): Promise<void> {
    try {
      console.log('Verifying email');
      const response = await fetch(`${API_URL}/auth/verify-email/${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Email verification failed:', error);
        throw new Error(error.message || 'Email verification failed');
      }

      console.log('Email verification successful');
      
      // Update user verification status
      const user = await this.getCurrentUser();
      if (user) {
        user.isVerified = true;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  async updateProfile(data: ProfileUpdateData): Promise<User> {
    try {
      console.log('Updating profile');
      const token = await this.getToken();
      
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Profile update failed:', error);
        throw new Error(error.message || 'Profile update failed');
      }

      const { user } = await response.json();
      console.log('Profile update successful');
      
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  },
}; 