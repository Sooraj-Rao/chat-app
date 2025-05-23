"use client";

import type React from "react";
import type { User } from "@/types/chat";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { dataSyncService } from "@/lib/data-sync";

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

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const storedUserId = localStorage.getItem("userId");

      if (!storedUserId) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, fullname, username, gender, image, phone")
        .eq("id", storedUserId)
        .single();

      if (error || !data) {
        console.error("Error fetching user:", error);
        localStorage.removeItem("userId");
        setUser(null);
      } else {
        setUser(data);
        dataSyncService.setUserId(data.id);
        dataSyncService.syncUserData();
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
      const { data, error } = await supabase
        .from("users")
        .select("id, fullname, username, gender, image, phone, password")
        .eq("username", username)
        .single();

      if (error || !data) {
        throw new Error("Invalid username or password");
      }

      if (data.password !== password) {
        throw new Error("Invalid username or password");
      }

      localStorage.setItem("userId", data.id);

      const { password: _, ...userWithoutPassword } = data;
      setUser(userWithoutPassword);

      dataSyncService.setUserId(data.id);
      dataSyncService.syncUserData();

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
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .single();

      if (existingUser) {
        throw new Error("Username already taken");
      }

      const { data, error } = await supabase
        .from("users")
        .insert({
          fullname,
          username,
          password,
          gender,
          phone: phone || null,
        })
        .select("id, fullname, username, gender, image, phone")
        .single();

      if (error || !data) {
        throw new Error("Failed to create account");
      }

      localStorage.setItem("userId", data.id);
      setUser(data);

      dataSyncService.setUserId(data.id);
      dataSyncService.syncUserData();

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
        .select("id, fullname, username, gender, image, phone")
        .single();

      if (error) {
        throw error;
      }

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
