"use client";

import { spotify } from "@/lib/spotify/auth";
import { Music } from "lucide-react";

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      await spotify.authenticate();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-background-secondary p-8 rounded-xl border border-border">
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
          className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-full text-black bg-spotify-green hover:bg-spotify-green-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-spotify-green transition-all duration-200 transform hover:scale-[1.02]"
        >
          Connect with Spotify
        </button>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-8">
          By connecting, you agree to allow SyncSpot to manage your Spotify playlists.
        </p>
      </div>
    </div>
  );
}
