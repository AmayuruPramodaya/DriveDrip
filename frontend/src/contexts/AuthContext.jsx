import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const response = await apiClient.get('/user/');
          setUser(response.data);
        } catch (err) {
          console.error('Failed to fetch user info on load or token expired:', err.response?.data || err.message);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, [navigate]); // Added navigate to dependency array as per ESLint suggestion

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/token/', { username, password });
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('refreshToken', response.data.refresh);
      
      // apiClient's interceptor will pick up the new token for subsequent requests
      const userResponse = await apiClient.get('/user/');
      setUser(userResponse.data);
      setLoading(false);
      
      // Role-based redirection
      const user = userResponse.data;
      switch (user.role) {
        case 'ADMIN':
          navigate('/admin/dashboard');
          break;
        case 'SELLER':
          navigate('/seller/dashboard');
          break;
        case 'BUYER':
          navigate('/buyer/dashboard');
          break;
        case 'MECHANIC':
          navigate('/dashboard');
          break;
        default:
          navigate('/dashboard');
      }
      
      return true;
    } catch (err) {
      console.error('Login failed:', err.response?.data || err.message);
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setUser(null);
      setLoading(false);
      return false;
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/user/register/', userData);
      setLoading(false);
      
      // Show success message and redirect to login with a message
      alert(`Registration successful! Welcome ${userData.role.toLowerCase()}! Please login to continue.`);
      navigate('/login');
      return true;
    } catch (err) {
      console.error('Registration failed:', err.response?.data || err.message);
      let errorMessage = 'Registration failed. Please try again.';
      if (err.response?.data) {
        // Attempt to format backend errors nicely
        const errors = err.response.data;
        errorMessage = Object.entries(errors).map(([field, messages]) => 
          `${field.charAt(0).toUpperCase() + field.slice(1)}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
        ).join('; ');
      }
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const contextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setUser, // Exposing setUser for profile updates
    setError // Exposing setError if needed by other components
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) { // Changed from undefined to null to match createContext
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};