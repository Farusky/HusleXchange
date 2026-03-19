import { Post, UserProfile } from '../types';

const POSTS_KEY = 'app_posts';
const USERS_KEY = 'app_users';

export const dataService = {
  // Posts
  getPosts: async (): Promise<Post[]> => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) return await res.json();
    } catch (err) {}
    return [];
  },

  createPost: async (post: Omit<Post, 'id' | 'createdAt'>): Promise<Post> => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to create post");
    }

    const newPost = await res.json();
    window.dispatchEvent(new Event('data-change'));
    return newPost;
  },

  // Users
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) return await res.json();
    } catch (err) {}
    return null;
  },

  updateUserProfile: async (uid: string, profile: Partial<UserProfile>): Promise<void> => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to update profile");
    }

    window.dispatchEvent(new Event('data-change'));
  },

  onDataChange: (callback: () => void) => {
    window.addEventListener('data-change', callback);
    window.addEventListener('storage', callback);
    return () => {
      window.removeEventListener('data-change', callback);
      window.removeEventListener('storage', callback);
    };
  }
};
