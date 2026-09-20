import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('chatuu_token') || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user if token exists on load
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        setUser(res.data.user);
      } catch (err) {
        console.error('Failed to load user session:', err);
        setToken(null);
        localStorage.removeItem('chatuu_token');
        localStorage.removeItem('chatuu_user');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('chatuu_token', newToken);
    localStorage.setItem('chatuu_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (username, email, password, displayName) => {
    const res = await api.post('/auth/register', { username, email, password, displayName });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('chatuu_token', newToken);
    localStorage.setItem('chatuu_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/users/profile', profileData);
    const updated = res.data.user;
    setUser(updated);
    localStorage.setItem('chatuu_user', JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    localStorage.removeItem('chatuu_token');
    localStorage.removeItem('chatuu_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
