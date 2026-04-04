import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PropertiesProvider } from './contexts/PropertiesContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { CommunityProvider } from './contexts/CommunityContext';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { LandlordDashboard } from './components/landlord/LandlordDashboard';
import { TenantDashboard } from './components/tenant/TenantDashboard';
import { Toaster } from './components/ui/sonner';
import { supabase } from "./lib/supabase"

async function testDB() {
  const { data, error } = await supabase.from("users").select("*")
  console.log("DATA:", data)
  console.log("ERROR:", error)
}

testDB()
type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password';

function AppContent() {
  const { user, needsPasswordReset } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');

  // Reset to login page when user logs out
  React.useEffect(() => {
    if (!user) {
      setAuthView('login');
    }
  }, [user]);

  // Show reset password for first-time tenant login
  if (user && needsPasswordReset) {
    return <ResetPasswordPage />;
  }

  // Show role-based dashboard
  if (user) {
    return (
      <AppDataProvider>
        <PropertiesProvider>
          <CommunityProvider>
            {user.role === 'landlord' ? <LandlordDashboard /> : <TenantDashboard />}
          </CommunityProvider>
        </PropertiesProvider>
      </AppDataProvider>
    );
  }

  // Show authentication screens
  switch (authView) {
    case 'signup':
      return <SignUpPage onBack={() => setAuthView('login')} />;
    case 'forgot-password':
      return <ForgotPasswordPage onBack={() => setAuthView('login')} />;
    default:
      return (
        <LoginPage 
          onForgotPassword={() => setAuthView('forgot-password')}
          onSignUp={() => setAuthView('signup')}
        />
      );
  }
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}