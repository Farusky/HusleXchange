import { UserProfile } from '../types';

const AUTH_KEY = 'app_user_session';

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
}

export const authService = {
  getCurrentUser: async (): Promise<MockUser | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        return { uid: data.uid, email: data.email, displayName: data.name, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}` };
      }
    } catch (err) {}
    return null;
  },

  login: async (email: string, password?: string): Promise<MockUser> => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await res.json();
    const user = { uid: data.uid, email: data.email, displayName: data.name, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}` };
    window.dispatchEvent(new Event('auth-change'));
    return user;
  },

  register: async (name: string, email: string, password?: string, phone?: string): Promise<MockUser> => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Registration failed");
    }

    const data = await res.json();
    const user = { uid: data.uid, email: data.email, displayName: data.name, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}` };
    window.dispatchEvent(new Event('auth-change'));
    return user;
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.dispatchEvent(new Event('auth-change'));
  },

  onAuthStateChanged: (callback: (user: MockUser | null) => void) => {
    const handler = async () => callback(await authService.getCurrentUser());
    window.addEventListener('auth-change', handler);
    window.addEventListener('storage', handler);
    // Initial call
    authService.getCurrentUser().then(callback);
    return () => {
      window.removeEventListener('auth-change', handler);
      window.removeEventListener('storage', handler);
    };
  }
};
