"use client"

import React, { createContext, ReactNode, useState, useEffect } from "react";

interface AuthContextType {
    token: string | null;
    setToken: (token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface ProviderProps {
    children: ReactNode;
}

export const AuthenticationProvider = ({ children }: ProviderProps) => {
    const [token, setToken] = useState<string | null>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("auth_token");
        }
        return null;
    });

    useEffect(() => {
        if (token) {
            localStorage.setItem("auth_token", token);
        } else {
            localStorage.removeItem("auth_token");
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};