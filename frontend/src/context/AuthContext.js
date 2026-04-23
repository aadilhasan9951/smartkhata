import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests if available
api.interceptors.request.use(async (config) => {
  const { value: token } = await Preferences.get({ key: 'token' });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { value: token } = await Preferences.get({ key: 'token' });
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      await Preferences.remove({ key: 'token' });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (phone, name) => {
    try {
      console.log('Login attempt:', { phone, name });
      const response = await api.post('/auth/login', { phone, name });
      console.log('Login response:', response.data);
      const { token, user } = response.data;
      await Preferences.set({ key: 'token', value: token });
      console.log('Token saved to Preferences');
      setUser(user);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await api.post('/auth/logout');
    await Preferences.remove({ key: 'token' });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
