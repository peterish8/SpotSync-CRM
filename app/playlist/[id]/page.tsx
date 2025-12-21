"use client";

import { useEffect, useState } from "react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { Music, ArrowLeft, Clock, Heart, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

interface PlaylistTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
  added_at: string;
}

interface PlaylistData {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  owner: { display_name: string };
  total: number;
  tracks: PlaylistTrack[];
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

function formatTotalDuration(tracks: PlaylistTrack[]) {
  const totalMs = tracks.reduce((acc, t) => acc + t.duration_ms, 0);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  if (hours > 0) {
    return `${hours} hr ${minutes} min`;
  }
  return `${minutes} min`;
}

export default function PlaylistDetailPage() {
  const router = useRouter();
  const params = useParams();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    async function fetchPlaylist() {
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

        if (playlistId === "liked-songs") {
          // Fetch Liked Songs
          const response = await sdk.currentUser.tracks.savedTracks(50, 0);
          
          setPlaylist({
            id: "liked-songs",
            name: "Liked Songs",
            description: "Songs you've liked",
            images: [],
            owner: { display_name: "You" },
            total: response.total,
            tracks: response.items.map((item) => ({
              id: item.track.id,
              name: item.track.name,
              artists: item.track.artists.map((a) => ({ id: a.id, name: a.name })),
              album: {
                name: item.track.album.name,
                images: item.track.album.images,
              },
              duration_ms: item.track.duration_ms,
              uri: item.track.uri,
              added_at: item.added_at,
            })),
          });
        } else {
          // Fetch regular playlist
          const playlistInfo = await sdk.playlists.getPlaylist(playlistId);
          const tracksResponse = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, 0);

          setPlaylist({
            id: playlistInfo.id,
            name: playlistInfo.name,
            description: playlistInfo.description || "",
            images: playlistInfo.images,
            owner: { display_name: playlistInfo.owner.display_name || "Unknown" },
            total: playlistInfo.tracks.total,
            tracks: tracksResponse.items
              .filter((item) => item.track && item.track.type === "track")
              .map((item) => {
                const track = item.track as any;
                return {
                  id: track.id,
                  name: track.name,
                  artists: track.artists.map((a: any) => ({ id: a.id, name: a.name })),
                  album: {
                    name: track.album.name,
                    images: track.album.images,
                  },
                  duration_ms: track.duration_ms,
                  uri: track.uri,
                  added_at: item.added_at,
                };
              }),
          });
        }
      } catch (error) {
        console.error("Failed to fetch playlist:", error);
      } finally {
        setLoading(false);
      }
    }

    if (playlistId) {
      fetchPlaylist();
    }
  }, [playlistId, router]);

  async function loadMore() {
    if (!playlist || loadingMore) return;
    
    const currentCount = playlist.tracks.length;
    if (currentCount >= playlist.total) return;

    setLoadingMore(true);
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      let newTracks: PlaylistTrack[] = [];

      if (playlistId === "liked-songs") {
        const response = await sdk.currentUser.tracks.savedTracks(50, currentCount);
        newTracks = response.items.map((item) => ({
          id: item.track.id,
          name: item.track.name,
          artists: item.track.artists.map((a) => ({ id: a.id, name: a.name })),
          album: {
            name: item.track.album.name,
            images: item.track.album.images,
          },
          duration_ms: item.track.duration_ms,
          uri: item.track.uri,
          added_at: item.added_at,
        }));
      } else {
        const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, currentCount);
        newTracks = response.items
          .filter((item) => item.track && item.track.type === "track")
          .map((item) => {
            const track = item.track as any;
            return {
              id: track.id,
              name: track.name,
              artists: track.artists.map((a: any) => ({ id: a.id, name: a.name })),
              album: {
                name: track.album.name,
                images: track.album.images,
              },
              duration_ms: track.duration_ms,
              uri: track.uri,
              added_at: item.added_at,
            };
          });
      }

      setPlaylist((prev) => prev ? {
        ...prev,
        tracks: [...prev.tracks, ...newTracks],
      } : null);
    } catch (error) {
      console.error("Failed to load more:", error);
    } finally {
      setLoadingMore(false);
    }
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

  if (!playlist) {
    return (
      <MainLayout>
        <div className="text-center py-20">
          <p className="text-text-secondary">Playlist not found</p>
          <Link href="/">
            <Button className="mt-4">Go Back</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isLikedSongs = playlistId === "liked-songs";

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Library
          </Button>
        </Link>

        {/* Playlist Header */}
        <div className="flex gap-6 items-end">
          {isLikedSongs ? (
            <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center shadow-2xl flex-shrink-0">
              <Heart className="w-20 h-20 text-white fill-white" />
            </div>
          ) : playlist.images?.[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="w-48 h-48 rounded-lg object-cover shadow-2xl flex-shrink-0"
            />
          ) : (
            <div className="w-48 h-48 rounded-lg bg-background-tertiary flex items-center justify-center flex-shrink-0">
              <Music className="w-20 h-20 text-text-tertiary" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">Playlist</p>
            <h1 className="text-4xl font-bold text-text-primary mb-2 truncate">{playlist.name}</h1>
            {playlist.description && (
              <p className="text-sm text-text-secondary mb-3 line-clamp-2">{playlist.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="font-medium text-text-primary">{playlist.owner.display_name}</span>
              <span>•</span>
              <span>{playlist.total} songs</span>
              <span>•</span>
              <span>{formatTotalDuration(playlist.tracks)}</span>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="bg-background-secondary rounded-xl overflow-hidden">
          {/* Header Row */}
          <div className="grid grid-cols-[40px_1fr_1fr_120px_80px] gap-4 px-4 py-3 border-b border-border text-xs text-text-tertiary uppercase tracking-wider">
            <div className="text-center">#</div>
            <div>Title</div>
            <div>Album</div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Date Added
            </div>
            <div className="flex items-center justify-end gap-1">
              <Clock className="w-3 h-3" />
            </div>
          </div>

          {/* Track Rows */}
          <div className="divide-y divide-border/50">
            {playlist.tracks.map((track, index) => (
              <div
                key={`${track.id}-${index}`}
                className="grid grid-cols-[40px_1fr_1fr_120px_80px] gap-4 px-4 py-3 hover:bg-background-hover transition-colors group"
              >
                {/* Track Number */}
                <div className="flex items-center justify-center text-text-tertiary text-sm">
                  {index + 1}
                </div>

                {/* Title & Artist */}
                <div className="flex items-center gap-3 min-w-0">
                  {track.album.images?.[0] ? (
                    <img
                      src={track.album.images[track.album.images.length - 1]?.url || track.album.images[0].url}
                      alt={track.album.name}
                      className="w-10 h-10 rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-background-tertiary flex items-center justify-center flex-shrink-0">
                      <Music className="w-4 h-4 text-text-tertiary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-text-primary font-medium truncate">{track.name}</p>
                    <p className="text-sm text-text-secondary truncate">
                      {track.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                </div>

                {/* Album */}
                <div className="flex items-center min-w-0">
                  <p className="text-sm text-text-secondary truncate">{track.album.name}</p>
                </div>

                {/* Date Added */}
                <div className="flex items-center">
                  <p className="text-sm text-text-tertiary">{formatDate(track.added_at)}</p>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-end">
                  <p className="text-sm text-text-tertiary">{formatDuration(track.duration_ms)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {playlist.tracks.length < playlist.total && (
            <div className="p-4 border-t border-border">
              <Button
                variant="secondary"
                className="w-full"
                onClick={loadMore}
                isLoading={loadingMore}
              >
                Load More ({playlist.total - playlist.tracks.length} remaining)
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
