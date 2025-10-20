'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, authAPI, RegisterData } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    updateUser: (userData: User) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    const userData = await authAPI.getProfile();
                    setUser(userData);
                } catch {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authAPI.login({ email, password });
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        // Recharger le profil depuis le backend pour avoir un email_verified à jour
        const freshUser = await authAPI.getProfile();
        setUser(freshUser);
    };

    const register = async (data: RegisterData) => {
        const response = await authAPI.register(data);
        localStorage.setItem('access_token', response.tokens.access);
        localStorage.setItem('refresh_token', response.tokens.refresh);
        // Recharger le profil depuis le backend pour avoir un email_verified à jour
        const freshUser = await authAPI.getProfile();
        setUser(freshUser);
    };

    const logout = async () => {
        await authAPI.logout();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const userData = await authAPI.getProfile();
                setUser(userData);
            } catch {
                // Si le token est invalide, on déconnecte l'utilisateur
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                setUser(null);
            }
        }
    };

    const updateUser = (userData: User) => {
        setUser(userData);
    };

    const value = {
        user,
        login,
        register,
        logout,
        refreshUser,
        updateUser,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
