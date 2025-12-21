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

        const playlists = await sdk.currentUser.playlists.playlists(50);
        setAvailablePlaylists(
          playlists.items.map((p) => ({
            id: p.id,
            name: p.name,
            images: p.images || [],
            total: p.tracks?.total || 0,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
        toast.error("Failed to load playlists");
      } finally {
        setLoading(false);
      }
    }

    fetchPlaylists();
  }, [router, setAvailablePlaylists]);

  // Load playlist tracks
  async function loadPlaylistTracks(playlistId: string, side: "A" | "B") {
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      const playlistInfo = await sdk.playlists.getPlaylist(playlistId);
      const tracks = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 100);

      const playlist: Playlist = {
        id: playlistInfo.id,
        name: playlistInfo.name,
        images: playlistInfo.images || [],
        total: playlistInfo.tracks.total,
        tracks: tracks.items
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
          }),
      };

      if (side === "A") {
        setPlaylistA(playlist);
      } else {
        setPlaylistB(playlist);
      }

      toast.success(`Loaded ${playlist.name}`);
    } catch (error) {
      console.error("Failed to load playlist:", error);
      toast.error("Failed to load playlist tracks");
    }
  }

  // Drag handlers
  function handleDragStart(event: DragStartEvent) {
    const track = event.active.data.current?.track as Track;
    setActiveTrack(track);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTrack(null);

    const { active, over } = event;
    if (!over) return;

    const sourceData = active.data.current;
    const targetData = over.data.current;

    if (!sourceData || !targetData) return;

    const track = sourceData.track as Track;
    const sourceSide = sourceData.sourcePlaylistId === playlistA?.id ? "A" : "B";
    const targetSide = targetData.side as "A" | "B";

    // Don't do anything if dropping in same playlist
    if (sourceSide === targetSide) return;

    // Add to target
    addTrackToPlaylist(track, targetSide);

    // Remove from source if move mode
    if (dragMode === "move") {
      removeTrackFromPlaylist(track.id, sourceSide);
      toast.success(`Moved "${track.name}"`);
    } else {
      toast.success(`Copied "${track.name}"`);
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
