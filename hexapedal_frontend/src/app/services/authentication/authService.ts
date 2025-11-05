export type LoginResponse = {
    token: string;
    expiresIn: number;
};

export async function login(
    email: string,
    password: string,
    setToken: (token: string) => void
): Promise<LoginResponse> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Login failed");
    }
    const data = await res.json();
    setToken(data.token);
    return data;
}

export function logout(setToken: (token: null) => void) {
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_token_expires_at");
}