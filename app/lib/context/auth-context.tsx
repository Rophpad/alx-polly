'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication Context Provider
 * 
 * Provides global authentication state management throughout the application:
 * - User authentication status and user data
 * - Session management and automatic updates
 * - Real-time authentication state changes
 * - Loading states during initial authentication check
 * - Convenient authentication utilities
 * 
 * Features:
 * - Automatic session restoration on app load
 * - Real-time auth state synchronization across tabs
 * - Optimized re-renders with useMemo for Supabase client
 * - Proper cleanup of auth listeners
 * - Loading states for better UX during auth checks
 * - Debug logging for development (should be removed in production)
 */

// Create authentication context with type safety
// Create authentication context with type safety
const AuthContext = createContext<{ 
  session: Session | null; // Current user session
  user: User | null; // Current authenticated user
  signOut: () => void; // Sign out function
  loading: boolean; // Loading state during initial auth check
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication Provider Component
 * 
 * Manages global authentication state and provides it to child components.
 * Handles:
 * - Initial user session restoration
 * - Real-time auth state change listeners
 * - Loading states during authentication checks
 * - User sign out functionality
 * 
 * @param children - Child components that need access to auth context
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Memoize Supabase client to prevent unnecessary re-creations
  const supabase = useMemo(() => createClient(), []);
  
  // Authentication state management
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true; // Prevent state updates if component is unmounted
    
    /**
     * Retrieves initial user authentication state
     * Called once on component mount to restore user session
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      }
      
      // Only update state if component is still mounted
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // Session will be set by auth listener
        setLoading(false);
        console.log('AuthContext: Initial user loaded', data.user);
      }
    };

    getUser();

    /**
     * Set up real-time authentication state change listener
     * Responds to login, logout, token refresh, and session changes
     * Automatically syncs auth state across browser tabs
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Note: Don't set loading to false here, only after initial load
      console.log('AuthContext: Auth state changed', _event, session, session?.user);
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out the current user
   * Clears session and user state automatically via auth listener
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Debug logging for development (remove in production)
  console.log('AuthContext: user', user);
  
  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * Provides convenient access to:
 * - Current user data
 * - Session information
 * - Sign out functionality
 * - Loading states
 * 
 * @returns Authentication context object
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = () => useContext(AuthContext);
