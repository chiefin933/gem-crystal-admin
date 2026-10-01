import React, { createContext, useContext, useState } from 'react';
import {
  ApiRequestError,
  confirmMfaSetup as confirmMfaSetupRequest,
  loginAdmin,
  logoutAdmin,
  setAuthToken,
  startMfaSetup,
} from '../api/adminApi';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'CASHIER';
  mfaEnabled: boolean;
}

interface MfaSetupState {
  setupToken: string;
  secret: string;
  otpauthUri: string;
}

export type LoginResult = 'authenticated' | 'mfa-required' | 'setup-required';


interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  mfaSetup: MfaSetupState | null;
  recoveryCodes: string[];
  login: (email: string, pass: string, mfaCode?: string) => Promise<LoginResult>;
  confirmMfaSetup: (code: string) => Promise<void>;
  acknowledgeRecoveryCodes: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading] = useState(false);
  const [mfaSetup, setMfaSetup] = useState<MfaSetupState | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const applySession = (res: { token: string; admin: AdminUser }) => {
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.admin);
  };

  const login = async (email: string, pass: string, mfaCode?: string): Promise<LoginResult> => {
    try {
      const res = await loginAdmin(email, pass, mfaCode);
      applySession(res);
      setMfaSetup(null);
      return 'authenticated';
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'MFA_REQUIRED') return 'mfa-required';
        if (error.code === 'MFA_SETUP_REQUIRED') {
          const setupToken = error.details.setupToken;
          if (typeof setupToken === 'string') {
            const setup = await startMfaSetup(setupToken);
            setMfaSetup({
              setupToken,
              secret: setup.secret,
              otpauthUri: setup.otpauthUri,
            });
            return 'setup-required';
          }
        }
      }
      throw error;
    }
  };

  const confirmMfaSetup = async (code: string) => {
    if (!mfaSetup) throw new Error('MFA setup has expired. Sign in again.');
    const res = await confirmMfaSetupRequest(mfaSetup.setupToken, code);
    applySession(res);
    setMfaSetup(null);
    setRecoveryCodes(res.recoveryCodes);
  };

  const acknowledgeRecoveryCodes = () => setRecoveryCodes([]);

  const logout = async () => {
    try {
      if (token) await logoutAdmin();
    } finally {
      setAuthToken(null);
      setToken(null);
      setUser(null);
      setMfaSetup(null);
      setRecoveryCodes([]);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, mfaSetup, recoveryCodes,
      login, confirmMfaSetup, acknowledgeRecoveryCodes, logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
