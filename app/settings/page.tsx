"use client";

import { useEffect, useState } from "react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Card, CardContent, Button } from "@/components/ui";
import { User, LogOut, ExternalLink, Music, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  country: string;
  product: string;
  followers: { total: number };
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const sdk = SpotifyApi.withUserAuthorization(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
          process.env.NEXT_PUBLIC_REDIRECT_URI!,
          [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
        );

        const { authenticated } = await sdk.authenticate();
        if (!authenticated) {
          router.push("/login");
          return;
        }

        const user = await sdk.currentUser.profile();
        setProfile({
          id: user.id,
          display_name: user.display_name || "Spotify User",
          email: user.email || "",
          images: user.images || [],
          country: user.country || "",
          product: user.product || "free",
          followers: { total: user.followers?.total || 0 },
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [router]);

  function handleLogout() {
    // Clear any stored tokens
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login
    router.push("/login");
    toast.success("Logged out successfully");
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: "#181818", color: "#fff", border: "1px solid #282828" },
        }}
      />

      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
          <p className="text-text-secondary mt-1">Manage your account and preferences</p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </h2>

            <div className="flex items-center gap-6">
              {profile?.images?.[0] ? (
                <img
                  src={profile.images[0].url}
                  alt={profile.display_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-background-tertiary flex items-center justify-center">
                  <User className="w-10 h-10 text-text-tertiary" />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-text-primary">{profile?.display_name}</h3>
                <p className="text-text-secondary">{profile?.email}</p>
                <div className="flex items-center gap-3 text-sm text-text-tertiary">
                  <span>{profile?.followers?.total || 0} followers</span>
                  <span>•</span>
                  <span className="capitalize">{profile?.country}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Music className="w-5 h-5" />
              Spotify Subscription
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-primary font-medium capitalize">
                  {profile?.product === "premium" ? "Spotify Premium" : "Spotify Free"}
                </p>
                <p className="text-sm text-text-secondary">
                  {profile?.product === "premium"
                    ? "You have full access to all features"
                    : "Upgrade for ad-free experience"}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  profile?.product === "premium"
                    ? "bg-spotify-green/20 text-spotify-green"
                    : "bg-text-tertiary/20 text-text-tertiary"
                }`}
              >
                {profile?.product === "premium" ? "Premium" : "Free"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              App Permissions
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Read your playlists</span>
                <span className="text-spotify-green text-sm">✓ Granted</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Modify your playlists</span>
                <span className="text-spotify-green text-sm">✓ Granted</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">Access your liked songs</span>
                <span className="text-spotify-green text-sm">✓ Granted</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-text-secondary">View your profile</span>
                <span className="text-spotify-green text-sm">✓ Granted</span>
              </div>
            </div>

            <a
              href="https://www.spotify.com/account/apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm text-spotify-green hover:underline"
            >
              Manage on Spotify
              <ExternalLink className="w-4 h-4" />
            </a>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Sign Out</h2>
                <p className="text-sm text-text-secondary">
                  Log out of your Spotify account
                </p>
              </div>
              <Button variant="danger" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <div className="text-center py-6 text-text-tertiary text-sm">
          <p>SyncSpot CRM v1.0.0</p>
          <p className="mt-1">Built with Next.js & Spotify Web API</p>
        </div>
      </div>
    </MainLayout>
  );
}
