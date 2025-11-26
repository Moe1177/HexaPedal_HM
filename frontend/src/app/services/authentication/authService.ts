import { API_BASE_URL } from "../utils/constants";

export type LoginResponse = {
    token: string;
    expiresIn: number;
};

export async function login(
    email: string,
    password: string,
    setToken: (token: string) => void
): Promise<LoginResponse> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        let errorMessage = "Login failed";
        try {
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                errorMessage = data.message || data || "Login failed";
            } else {
                const text = await res.text();
                errorMessage = text || "Login failed";
            }
        } catch (e) {
            errorMessage = res.statusText || "Login failed";
        }
        throw new Error(errorMessage);
    }
    
    const data: LoginResponse = await res.json();
    
    if (!data.token) {
        throw new Error("Invalid response: token not found");
    }
    
    setToken(data.token);
    return data;
}

export function logout(setToken: (token: null) => void) {
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_token_expires_at");
}