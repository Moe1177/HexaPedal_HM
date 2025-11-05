import { API_BASE_URL } from "../utils/constants";

export interface CurrentUser {
  id: number;
  email: string;
  username: string;
  fullName: string;
}

/**
 * Decodes JWT token to extract email
 */
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

/**
 * Get current user info from backend
 * This assumes there's an endpoint to get current user, or we can decode from token
 * For now, we'll use email from token and fetch user by email
 */
export async function getCurrentUser(email: string): Promise<CurrentUser | null> {
  // Since there's no current user endpoint, we'll decode from token
  // In production, you'd want to add a /api/users/me endpoint
  // For now, we'll handle this in the UI components
  return null;
}

