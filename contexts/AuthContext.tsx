import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAdmin: boolean;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
    loginAsAdmin: (email: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
                setIsAdmin(userRole === 'admin');
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
                    // Re-check role from localStorage to ensure context is up-to-date
                    const userRole = localStorage.getItem('userRole');
                    setIsAdmin(userRole === 'admin');
                } else if (event === 'SIGNED_OUT') {
                    localStorage.removeItem('userRole');
                    setIsAdmin(false);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

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
    
    const loginAsAdmin = async (email: string, password: string): Promise<boolean> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.session) {
            localStorage.setItem('userRole', 'admin');
            setIsAdmin(true);
            return true;
        }
        localStorage.removeItem('userRole');
        setIsAdmin(false);
        return false;
    }

    const logout = async () => {
        await supabase.auth.signOut();
        // Clear state immediately for faster UI response, although onAuthStateChange will also fire.
        localStorage.removeItem('userRole');
        setUser(null);
        setSession(null);
        setIsAdmin(false);
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