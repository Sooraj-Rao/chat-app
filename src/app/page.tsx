"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiMessageCircle } from "react-icons/fi";
import { useAuth } from "@/components/providers/auth-provider";
import AuthModal from "@/components/auth/auth-modal";

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/chats");
    }
  }, [user, isLoading, router]);

  const openLoginModal = () => {
    setAuthMode("login");
    setIsAuthModalOpen(true);
  };

  const openSignupModal = () => {
    setAuthMode("signup");
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <FiMessageCircle className="h-8 w-8 text-green-500" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Chat App
            </span>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={openLoginModal}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
            >
              Login
            </button>
            <button
              onClick={openSignupModal}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <FiMessageCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Welcome to Chat App
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Connect with friends and colleagues in real-time
            </p>
          </div>
          <div className="flex flex-col space-y-4">
            <button
              onClick={openSignupModal}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Get Started
            </button>
            <button
              onClick={openLoginModal}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              I already have an account
            </button>
          </div>
        </div>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}
