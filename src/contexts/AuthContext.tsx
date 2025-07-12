'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          
          // Verify token is still valid
          const response = await apiClient.get('/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const currentUser = await response.json();
            setUser({
              ...currentUser.user,
              createdAt: new Date(currentUser.user.createdAt),
              updatedAt: new Date(currentUser.user.updatedAt),
            });
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear invalid auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (userData: User, token: string) => {
    try {
      // Store auth data
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update user state
      setUser({
        ...userData,
        createdAt: new Date(userData.createdAt),
        updatedAt: new Date(userData.updatedAt),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No auth token found');
      }

      const response = await apiClient.get('/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const currentUser = await response.json();
        const updatedUser = {
          ...currentUser.user,
          createdAt: new Date(currentUser.user.createdAt),
          updatedAt: new Date(currentUser.user.updatedAt),
        };
        
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } else {
        throw new Error('Failed to refresh user data');
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Clear auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};