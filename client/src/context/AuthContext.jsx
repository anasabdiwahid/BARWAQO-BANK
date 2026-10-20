import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('barwaqo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data.user);
        setCustomer(res.data.data.customer);
        setAccounts(res.data.data.accounts || []);
        localStorage.setItem('barwaqo_user', JSON.stringify(res.data.data.user));
      }
    } catch (error) {
      setUser(null);
      setCustomer(null);
      setAccounts([]);
      localStorage.removeItem('barwaqo_user');
      localStorage.removeItem('barwaqo_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data.success) {
      const { user: loggedInUser, token, account } = res.data.data;
      localStorage.setItem('barwaqo_token', token);
      localStorage.setItem('barwaqo_user', JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      if (account) {
        setAccounts([account]);
      }
      await fetchCurrentUser();
      return loggedInUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue cleanup
    } finally {
      localStorage.removeItem('barwaqo_token');
      localStorage.removeItem('barwaqo_user');
      setUser(null);
      setCustomer(null);
      setAccounts([]);
      window.location.href = '/login';
    }
  };

  const primaryAccount = accounts && accounts.length > 0 ? accounts[0] : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        customer,
        accounts,
        primaryAccount,
        loading,
        login,
        logout,
        refreshMe: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

