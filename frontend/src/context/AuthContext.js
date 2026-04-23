import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_API_URL || 'https://smartkhata-8jaj.onrender.com/api';

// Check if running on native platform (Android/iOS)
const isNative = Capacitor.isNativePlatform();

// Hybrid storage - Preferences for native, localStorage for web
const getToken = async () => {
  if (isNative) {
    const { value } = await Preferences.get({ key: 'token' });
    return value;
  }
  return localStorage.getItem('token');
};

const setToken = async (token) => {
  if (isNative) {
    await Preferences.set({ key: 'token', value: token });
  } else {
    localStorage.setItem('token', token);
  }
};

const removeToken = async () => {
  if (isNative) {
    await Preferences.remove({ key: 'token' });
  } else {
    localStorage.removeItem('token');
  }
};

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Add token to requests if available
api.interceptors.request.use(async (config) => {
  const token = await getToken();
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
      const token = await getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      await removeToken();
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
      await setToken(token);
      console.log('Token saved');
      setUser(user);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    }
    await removeToken();
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
