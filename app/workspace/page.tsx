"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

import { MainLayout } from "@/components/layout";
import { PlaylistContainer, DragModeToggle, PlaylistSelector, SongCard } from "@/components/workspace";
import { usePlaylistStore, Track, Playlist } from "@/store/playlistStore";

export default function WorkspacePage() {
  const router = useRouter();
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    playlistA,
    playlistB,
    availablePlaylists,
    dragMode,
    setPlaylistA,
    setPlaylistB,
    setAvailablePlaylists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
  } = usePlaylistStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch playlists on mount
  useEffect(() => {
    async function fetchPlaylists() {
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

        // Fetch regular playlists
        const playlists = await sdk.currentUser.playlists.playlists(50);
        
        // Fetch Liked Songs count
        const likedSongs = await sdk.currentUser.tracks.savedTracks(1);
        
        // Create playlist list with Liked Songs at the top
        const playlistList = [
          {
            id: "liked-songs",
            name: "Liked Songs",
            images: [],
            total: likedSongs.total,
          },
          ...playlists.items.map((p) => ({
            id: p.id,
            name: p.name,
            images: p.images || [],
            total: p.tracks?.total || 0,
          })),
        ];
        
        setAvailablePlaylists(playlistList);
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
        toast.error("Failed to load playlists");
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylists();
  }, [router, setAvailablePlaylists]);

  // Load playlist tracks with full pagination
  async function loadPlaylistTracks(playlistId: string, side: "A" | "B") {
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      let playlist: Playlist;
      const allTracks: Track[] = [];

      // Handle Liked Songs specially
      if (playlistId === "liked-songs") {
        toast.loading("Loading all liked songs...", { id: "loading" });
        
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
          const response = await sdk.currentUser.tracks.savedTracks(limit, offset);
          
          const tracks = response.items
            .filter((item) => item.track)
            .map((item) => {
              const track = item.track as any;
              return {
                id: track.id,
                name: track.name,
                artists: track.artists.map((a: any) => ({ id: a.id, name: a.name })),
                album: {
                  name: track.album.name,
                  images: track.album.images || [],
                },
                uri: track.uri,
                duration_ms: track.duration_ms,
              };
            });
          
          allTracks.push(...tracks);
          offset += limit;
          hasMore = response.next !== null && offset < response.total;
        }

        playlist = {
          id: "liked-songs",
          name: "Liked Songs",
          images: [],
          total: allTracks.length,
          tracks: allTracks,
        };

        toast.dismiss("loading");
      } else {
        // Regular playlist with pagination
        const playlistInfo = await sdk.playlists.getPlaylist(playlistId);
        toast.loading(`Loading ${playlistInfo.name}...`, { id: "loading" });
        
        let offset = 0;
        const limit = 50;
        let hasMore = true;

        while (hasMore) {
          const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset);
          
          const tracks = response.items
            .filter((item) => item.track && item.track.type === "track")
            .map((item) => {
              const track = item.track as any;
              return {
                id: track.id,
                name: track.name,
                artists: track.artists.map((a: any) => ({ id: a.id, name: a.name })),
                album: {
                  name: track.album.name,
                  images: track.album.images || [],
                },
                uri: track.uri,
                duration_ms: track.duration_ms,
              };
            });
          
          allTracks.push(...tracks);
          offset += limit;
          hasMore = response.next !== null && offset < response.total;
        }

        playlist = {
          id: playlistInfo.id,
          name: playlistInfo.name,
          images: playlistInfo.images || [],
          total: allTracks.length,
          tracks: allTracks,
        };

        toast.dismiss("loading");
      }

      if (side === "A") {
        setPlaylistA(playlist);
      } else {
        setPlaylistB(playlist);
      }

      toast.success(`Loaded ${playlist.name} (${playlist.total} songs)`);
    } catch (error) {
      toast.dismiss("loading");
      console.error("Failed to load playlist:", error);
      toast.error("Failed to load playlist tracks");
    }
  }

  // Drag handlers
  function handleDragStart(event: DragStartEvent) {
    const track = event.active.data.current?.track as Track;
    setActiveTrack(track);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTrack(null);

    const { active, over } = event;
    if (!over) return;

    const sourceData = active.data.current;
    const targetData = over.data.current;

    if (!sourceData || !targetData) return;

    const track = sourceData.track as Track;
    const sourcePlaylistId = sourceData.sourcePlaylistId as string;
    const sourceSide = sourcePlaylistId === playlistA?.id ? "A" : "B";
    const targetSide = targetData.side as "A" | "B";
    const targetPlaylistId = targetSide === "A" ? playlistA?.id : playlistB?.id;

    // Don't do anything if dropping in same playlist
    if (sourceSide === targetSide) return;

    // Check if target is a real playlist (not Liked Songs for adding)
    if (!targetPlaylistId) return;

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      // Add to target playlist on Spotify
      if (targetPlaylistId !== "liked-songs") {
        await sdk.playlists.addItemsToPlaylist(targetPlaylistId, [track.uri]);
      } else {
        // Add to Liked Songs
        await sdk.currentUser.tracks.saveTracks([track.id]);
      }

      // Update local state
      addTrackToPlaylist(track, targetSide);

      // Remove from source if move mode
      if (dragMode === "move") {
        if (sourcePlaylistId !== "liked-songs") {
          await sdk.playlists.removeItemsFromPlaylist(sourcePlaylistId, {
            tracks: [{ uri: track.uri }],
          });
        } else {
          // Remove from Liked Songs
          await sdk.currentUser.tracks.removeSavedTracks([track.id]);
        }

        removeTrackFromPlaylist(track.id, sourceSide);
        toast.success(`Moved "${track.name}" to Spotify ✓`);
      } else {
        toast.success(`Copied "${track.name}" to Spotify ✓`);
      }
    } catch (error: any) {
      console.error("Failed to sync with Spotify:", error);
      toast.error(`Failed to sync: ${error.message || "Unknown error"}`);
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary">Loading workspace...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#181818",
            color: "#fff",
            border: "1px solid #282828",
          },
        }}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Playlist Workspace</h1>
              <p className="text-text-secondary">Drag and drop songs between playlists</p>
            </div>
            <DragModeToggle />
          </div>

          {/* Playlist Selectors */}
          <div className="grid grid-cols-2 gap-6">
            <PlaylistSelector side="A" onSelect={(id) => loadPlaylistTracks(id, "A")} />
            <PlaylistSelector side="B" onSelect={(id) => loadPlaylistTracks(id, "B")} />
          </div>

          {/* Dual Playlist View */}
          {playlistA && playlistB ? (
            <div className="grid grid-cols-2 gap-6">
              <PlaylistContainer playlist={playlistA} side="A" />
              <PlaylistContainer playlist={playlistB} side="B" />
            </div>
          ) : (
            <div className="text-center py-20 bg-background-secondary rounded-xl border border-border">
              <p className="text-text-secondary text-lg">
                Select two playlists above to start organizing
              </p>
            </div>
          )}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTrack ? (
            <div className="opacity-90 rotate-3 scale-105">
              <SongCard track={activeTrack} playlistId="" />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </MainLayout>
  );
}
