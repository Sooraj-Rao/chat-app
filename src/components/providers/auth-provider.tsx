"use client";

import type React from "react";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  fullname: string;
  username: string;
  gender: string;
  image: string | null;
  phone: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (
    fullname: string,
    username: string,
    password: string,
    gender: string,
    phone?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseClient(), []);

  // Check if user is logged in from localStorage
  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const storedUserId = localStorage.getItem("userId");

      if (!storedUserId) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Fetch user data from Supabase
      const { data, error } = await supabase
        .from("users")
        .select("id, fullname, username, gender, image")
        .eq("id", storedUserId)
        .single();

      if (error || !data) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("userId");
        setUser(null);
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      localStorage.removeItem("userId");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      // Find user with matching username and password
      const { data, error } = await supabase
        .from("users")
        .select("id, fullname, username, gender, image, password")
        .eq("username", username)
        .single();

      if (error || !data) {
        throw new Error("Invalid username or password");
      }

      // Check password (in a real app, you would compare hashed passwords)
      if (data.password !== password) {
        throw new Error("Invalid username or password");
      }

      // Store user ID in localStorage
      localStorage.setItem("userId", data.id);

      // Set user state (without the password)
      const { password: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);

      router.push("/chats");
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    fullname: string,
    username: string,
    password: string,
    gender: string,
    phone?: string
  ) => {
    setIsLoading(true);
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existingUser) {
        throw new Error("Username already taken");
      }

      // Create new user
      const { data, error } = await supabase
        .from("users")
        .insert({
          fullname,
          username,
          password, // In a real app, hash this password
          gender,
          phone: phone || null,
        })
        .select("id, fullname, username, gender, image")
        .single();

      if (error || !data) {
        throw new Error("Failed to create account");
      }

      // Store user ID in localStorage
      localStorage.setItem("userId", data.id);

      // Set user state
      setUser(data);

      router.push("/chats");
    } catch (error: any) {
      console.error("Signup error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("users")
        .update(data)
        .eq("id", user.id)
        .select("id, fullname, username, gender, image")
        .single();

      if (error) {
        throw error;
      }

      // Update local user state
      setUser((prev) => (prev ? { ...prev, ...data } : null));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    localStorage.removeItem("userId");
    setUser(null);
    router.push("/");
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    checkAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
