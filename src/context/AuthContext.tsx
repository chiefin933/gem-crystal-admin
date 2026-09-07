import React, { createContext, useContext, useState } from 'react';
import { loginAdmin, setAuthToken } from '../api/adminApi';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'CASHIER';
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading] = useState(false);

  const login = async (email: string, pass: string) => {
    const res = await loginAdmin(email, pass);
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.admin);
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
