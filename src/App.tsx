import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { RecoveryCodesPage } from './pages/RecoveryCodesPage';

const AppContent: React.FC = () => {
  const { user, isLoading, recoveryCodes } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-sm">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (recoveryCodes.length > 0) return <RecoveryCodesPage />;

  return user ? <DashboardPage /> : <LoginPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
