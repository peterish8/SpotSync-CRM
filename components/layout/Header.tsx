"use client";

import { useEffect, useState } from "react";
import { SpotifyApi, UserProfile, Scopes } from "@spotify/web-api-ts-sdk";
import { LogOut, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const sdk = SpotifyApi.withUserAuthorization(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
          process.env.NEXT_PUBLIC_REDIRECT_URI!,
          [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
        );
        const profile = await sdk.currentUser.profile();
        setUser(profile);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = () => {
    // Clear localStorage and redirect to login
    localStorage.clear();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-background-secondary border-b border-border flex items-center justify-between px-6">
      {/* Left side - Page title will be passed as children or via context */}
      <div>
        <h2 className="text-xl font-bold text-text-primary">Dashboard</h2>
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-background-hover transition-colors relative">
          <Bell className="w-5 h-5 text-text-secondary" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-spotify-green rounded-full" />
        </button>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary">{user.display_name}</p>
              <p className="text-xs text-text-secondary">{user.product || "Free"}</p>
            </div>
            {user.images?.[0] && (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="w-9 h-9 rounded-full border border-border"
              />
            )}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-background-hover transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
