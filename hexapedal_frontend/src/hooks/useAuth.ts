import { useContext } from "react";
import { AuthContext } from "../app/providers/AuthenticatorProvider";

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthenticationProvider");

    const { token, setToken } = context;

    const authFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> => {
        const headers = new Headers(init?.headers || {});
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers });
    };

    return { token, setToken, authFetch };
};
