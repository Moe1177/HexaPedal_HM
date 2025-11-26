import { API_BASE_URL } from "../utils/constants";

export interface CurrentUser {
  id: number;
  email: string;
  username: string;
  fullName: string;
}

export function getEmailFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.sub || decoded.email || null;
  } catch {
    return null;
  }
}

export function getUserIdFromToken(token: string | null): number | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    const userId = decoded.userId || decoded.user_id || decoded.id || decoded.sub;
    return userId ? Number(userId) : null;
  } catch {
    return null;
  }
}

// Decodes JWT token to get the user role
export function getRoleFromToken(token: string | null): Array<{ authority: string }> | null {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.role || null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(email: string): Promise<CurrentUser | null> {
  return null;
}

