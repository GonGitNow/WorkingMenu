import { useState, useCallback } from 'react';
import { User, AuthState } from '../types';
import { STORAGE_KEYS } from '../config/constants';

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      // TODO: Implement actual login API call
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        restaurants: [],
      };
      const mockToken = 'mock-token';
      
      // Store in local storage
      // await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, mockToken);
      // await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser));
      
      setState({
        user: mockUser,
        token: mockToken,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
      setState({
        user: null,
        token: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  return {
    ...state,
    login,
    logout,
  };
}; 