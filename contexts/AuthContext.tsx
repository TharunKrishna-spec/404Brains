import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    loginAsAdmin: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
    logout: () => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX: Refactored AuthProvider to use an explicit props interface and React.FC for clarity and robustness.
// This can help resolve complex type inference issues where the 'children' prop might not be correctly recognized.
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    // --- IMPORTANT: CONFIGURE YOUR ADMIN EMAIL HERE ---
    // Only the email address listed here will be allowed to log in as an admin.
    const ADMIN_EMAIL = 'troon12083@gmail.com'; // Replace with your admin email

    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
                const userRole = localStorage.getItem('userRole');
                // Check that the role is 'admin' AND the email matches the authorized admin email.
                setIsAdmin(userRole === 'admin' && session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
            } else {
                localStorage.removeItem('userRole');
                setIsAdmin(false);
            }
            setLoading(false);
        };
        getSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
                setUser(session?.user ?? null);

                if (event === 'SIGNED_IN') {
                    // Re-check role from localStorage and email to ensure context is up-to-date
                    const userRole = localStorage.getItem('userRole');
                    setIsAdmin(userRole === 'admin' && session?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
                } else if (event === 'SIGNED_OUT') {
                    localStorage.removeItem('userRole');
                    setIsAdmin(false);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [ADMIN_EMAIL]);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
            localStorage.setItem('userRole', 'team');
            setIsAdmin(false);
        } else if (error) {
            localStorage.removeItem('userRole');
            setIsAdmin(false);
        }
        return { error };
    };
    
    const loginAsAdmin = async (email: string, password: string): Promise<{ success: boolean; error: AuthError | null; }> => {
        // Only allow the configured admin email to attempt an admin login
        if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            return { success: false, error: { name: 'AuthApiError', message: 'This email is not authorized for admin access.' } as AuthError };
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
            localStorage.setItem('userRole', 'admin');
            setIsAdmin(true);
            return { success: true, error: null };
        }
        localStorage.removeItem('userRole');
        setIsAdmin(false);
        return { success: false, error };
    }

    const logout = async (): Promise<{ error: AuthError | null }> => {
        const { error } = await supabase.auth.signOut();
        // Clear state immediately for faster UI response, although onAuthStateChange will also fire.
        localStorage.removeItem('userRole');
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        return { error };
    };

    const value = {
        user,
        session,
        isAdmin,
        loading,
        login,
        loginAsAdmin,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};