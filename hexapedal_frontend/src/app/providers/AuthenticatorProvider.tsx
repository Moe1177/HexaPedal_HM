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
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("auth_token");
        if (storedToken) setToken(storedToken);
    }, []);

    return (
        <AuthContext.Provider value={{ token, setToken }}>
            {children}
        </AuthContext.Provider>
    );
};
