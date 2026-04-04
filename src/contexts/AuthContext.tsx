import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'landlord' | 'tenant' | null;

interface User {
  email: string;
  role: UserRole;
  name: string;
  isDemo?: boolean; // Track if this is a demo account with pre-filled data
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  signUp: (email: string, password: string, name: string) => boolean;
  logout: () => void;
  needsPasswordReset: boolean;
  completePasswordReset: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  // Check for persisted auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('proptrack_user');
    const savedNeedsReset = localStorage.getItem('proptrack_needs_reset');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedNeedsReset === 'true') {
      setNeedsPasswordReset(true);
    }
  }, []);

  const login = (email: string, password: string): boolean => {
    // Demo landlord account with pre-filled data
    if (email === 'landlord@proptrack.com') {
      const landlordUser: User = {
        email: 'landlord@proptrack.com',
        role: 'landlord',
        name: 'John Anderson',
        isDemo: true // This account gets pre-filled data
      };
      setUser(landlordUser);
      setNeedsPasswordReset(false);
      localStorage.setItem('proptrack_user', JSON.stringify(landlordUser));
      localStorage.removeItem('proptrack_needs_reset');
      return true;
    } else if (email === 'tenant@proptrack.com') {
      const tenantUser: User = {
        email: 'tenant@proptrack.com',
        role: 'tenant',
        name: 'Sarah Miller'
      };
      setUser(tenantUser);
      // First-time tenant login requires password reset
      setNeedsPasswordReset(true);
      localStorage.setItem('proptrack_user', JSON.stringify(tenantUser));
      localStorage.setItem('proptrack_needs_reset', 'true');
      return true;
    }
    
    // Check if user signed up before
    const savedAccounts = localStorage.getItem('proptrack_accounts');
    if (savedAccounts) {
      const accounts = JSON.parse(savedAccounts);
      const account = accounts.find((acc: any) => acc.email === email && acc.password === password);
      if (account) {
        const signedInUser: User = {
          email: account.email,
          role: 'landlord',
          name: account.name,
          isDemo: false // New landlord with empty state
        };
        setUser(signedInUser);
        setNeedsPasswordReset(false);
        localStorage.setItem('proptrack_user', JSON.stringify(signedInUser));
        localStorage.removeItem('proptrack_needs_reset');
        return true;
      }
    }
    
    return false;
  };

  const signUp = (email: string, password: string, name: string): boolean => {
    // Check if account already exists
    const savedAccounts = localStorage.getItem('proptrack_accounts');
    const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
    
    if (accounts.find((acc: any) => acc.email === email)) {
      return false; // Account already exists
    }
    
    // Save new account
    const newAccount = { email, password, name };
    accounts.push(newAccount);
    localStorage.setItem('proptrack_accounts', JSON.stringify(accounts));
    
    // Auto login after sign up
    const newUser: User = {
      email,
      role: 'landlord',
      name,
      isDemo: false // New landlord starts with empty dashboard
    };
    setUser(newUser);
    setNeedsPasswordReset(false);
    localStorage.setItem('proptrack_user', JSON.stringify(newUser));
    localStorage.removeItem('proptrack_needs_reset');
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setNeedsPasswordReset(false);
    localStorage.removeItem('proptrack_user');
    localStorage.removeItem('proptrack_needs_reset');
    
    // Prevent browser back button from returning to protected routes
    window.history.pushState(null, '', window.location.href);
    window.history.replaceState(null, '', window.location.pathname);
  };

  const completePasswordReset = () => {
    setNeedsPasswordReset(false);
    localStorage.removeItem('proptrack_needs_reset');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signUp,
        logout,
        needsPasswordReset,
        completePasswordReset
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}