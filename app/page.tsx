"use client";

import { useEffect, useState } from "react";
import { SpotifyApi, Scopes, SimplifiedPlaylist } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Card, CardContent, Button } from "@/components/ui";
import { Music, ListMusic, Play, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalPlaylists: number;
  totalTracks: number;
  likedSongsCount: number;
  allPlaylists: SimplifiedPlaylist[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
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

        // Fetch all playlists
        const playlists = await sdk.currentUser.playlists.playlists(50);
        
        // Fetch liked songs count
        const likedSongs = await sdk.currentUser.tracks.savedTracks(1);

        const totalTracks = playlists.items.reduce((acc, pl) => acc + (pl.tracks?.total || 0), 0);

        setStats({
          totalPlaylists: playlists.total,
          totalTracks,
          likedSongsCount: likedSongs.total,
          allPlaylists: playlists.items,
        });
      } catch (err: any) {
        console.error("Dashboard error:", err);
        if (err.message?.includes("No token")) {
          router.push("/login");
        } else {
          setError(err.message || "Failed to load dashboard");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary">Loading your playlists...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <p className="text-accent-red">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Welcome back!</h1>
          <p className="text-text-secondary mt-1">Manage your Spotify playlists with ease</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-spotify-green/20 rounded-xl flex items-center justify-center">
                  <ListMusic className="w-6 h-6 text-spotify-green" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">{stats?.totalPlaylists || 0}</p>
                  <p className="text-sm text-text-secondary">Total Playlists</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center">
                  <Music className="w-6 h-6 text-accent-blue" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-text-primary">{stats?.totalTracks || 0}</p>
                  <p className="text-sm text-text-secondary">Total Tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="interactive">
            <Link href="/workspace">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-purple/20 rounded-xl flex items-center justify-center">
                    <Play className="w-6 h-6 text-accent-purple" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-text-primary">Start Organizing</p>
                    <p className="text-sm text-text-secondary">Open Workspace →</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* All Playlists Grid */}
        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4">Your Library</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {/* Liked Songs Card */}
            <Link href="/playlist/liked-songs">
              <Card variant="interactive" className="group overflow-hidden">
                <div className="aspect-square relative bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center">
                  <Heart className="w-16 h-16 text-white fill-white" />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Play className="w-5 h-5 text-black ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-text-primary truncate text-sm">Liked Songs</p>
                  <p className="text-xs text-text-secondary">{stats?.likedSongsCount || 0} tracks</p>
                </div>
              </Card>
            </Link>

            {/* All Playlists */}
            {stats?.allPlaylists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                <Card variant="interactive" className="group overflow-hidden">
                  <div className="aspect-square relative">
                    {playlist.images?.[0] ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-background-tertiary flex items-center justify-center">
                        <Music className="w-12 h-12 text-text-tertiary" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 bg-spotify-green rounded-full flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <Play className="w-5 h-5 text-black ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-text-primary truncate text-sm">{playlist.name}</p>
                    <p className="text-xs text-text-secondary">{playlist.tracks?.total || 0} tracks</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
