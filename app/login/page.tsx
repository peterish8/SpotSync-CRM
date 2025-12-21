"use client";

import { spotify } from "@/lib/spotify/auth";
import { Music, AlertCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import toast, { Toaster } from "react-hot-toast";

function LoginContent() {
  const searchParams = useSearchParams();
  const isTimeout = searchParams.get("timeout") === "1";

  const handleLogin = async () => {
    try {
      await spotify.authenticate();
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Failed to connect to Spotify. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 bg-background-secondary p-8 rounded-xl border border-border">
        {/* Session Timeout Message */}
        {isTimeout && (
          <div className="flex items-center gap-3 p-4 bg-accent-orange/10 border border-accent-orange/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-accent-orange flex-shrink-0" />
            <div>
              <p className="text-accent-orange font-medium">Session Expired</p>
              <p className="text-text-secondary text-sm">Please login again to continue.</p>
            </div>
          </div>
        )}

        {/* Logo/Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-spotify-green rounded-full flex items-center justify-center mb-4">
            <Music className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary tracking-tight">
            SyncSpot CRM
          </h1>
          <p className="text-text-secondary">
            Professional Playlist Management
          </p>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full relative z-50 flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-black bg-spotify-green hover:bg-spotify-green-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spotify-green transition-all duration-200 transform hover:scale-[1.02]"
        >
          Connect with Spotify
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary">
          By connecting, you agree to allow SyncSpot to manage your Spotify playlists.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
