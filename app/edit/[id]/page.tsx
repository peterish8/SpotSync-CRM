"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { ArrowLeft, GripVertical, Music, Loader2, ChevronDown, Save, Heart } from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isSessionTimeoutError, handleSessionTimeout } from "@/lib/spotify/auth";

interface TrackItem {
  id: string;
  uri: string;
  name: string;
  artists: string;
  albumImage: string;
  duration: number;
  originalIndex: number;
}

interface PlaylistInfo {
  id: string;
  name: string;
  image: string;
  total: number;
  isLikedSongs: boolean;
}

function SortableTrack({ track, index }: { track: TrackItem; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 py-3 px-4 rounded-lg transition-colors ${
        isDragging ? "bg-spotify-green/20 shadow-lg" : "hover:bg-background-hover"
      }`}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-text-tertiary hover:text-spotify-green touch-none"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Track Number */}
      <span className="w-8 text-sm text-text-tertiary text-right">{index + 1}</span>

      {/* Album Art */}
      <div className="w-10 h-10 rounded bg-background-tertiary flex-shrink-0 overflow-hidden">
        {track.albumImage ? (
          <img src={track.albumImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-4 h-4 text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="text-text-primary font-medium truncate">{track.name}</p>
        <p className="text-sm text-text-secondary truncate">{track.artists}</p>
      </div>

      {/* Duration */}
      <span className="text-sm text-text-tertiary">{formatDuration(track.duration)}</span>
    </div>
  );
}

export default function EditPlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<PlaylistInfo | null>(null);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [originalOrder, setOriginalOrder] = useState<TrackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const [totalTracks, setTotalTracks] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Prefetch state
  const [prefetchedTracks, setPrefetchedTracks] = useState<TrackItem[]>([]);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const prefetchedRef = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isLikedSongs = playlistId === "liked-songs";

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

        let playlistInfo: PlaylistInfo;
        let initialTracks: TrackItem[] = [];

        if (isLikedSongs) {
          const response = await sdk.currentUser.tracks.savedTracks(50, 0);
          playlistInfo = {
            id: "liked-songs",
            name: "Liked Songs",
            image: "",
            total: response.total,
            isLikedSongs: true,
          };
          initialTracks = response.items.map((item, index) => ({
            id: item.track.id,
            uri: item.track.uri,
            name: item.track.name,
            artists: item.track.artists.map((a) => a.name).join(", "),
            albumImage: item.track.album?.images?.[item.track.album.images.length - 1]?.url || "",
            duration: item.track.duration_ms,
            originalIndex: index,
          }));
          setTotalTracks(response.total);
        } else {
          const playlistData = await sdk.playlists.getPlaylist(playlistId);
          playlistInfo = {
            id: playlistData.id,
            name: playlistData.name,
            image: playlistData.images?.[0]?.url || "",
            total: playlistData.tracks.total,
            isLikedSongs: false,
          };

          const tracksResponse = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, 0);
          initialTracks = tracksResponse.items
            .filter((item) => item.track)
            .map((item, index) => ({
              id: item.track!.id,
              uri: item.track!.uri,
              name: item.track!.name,
              artists: item.track!.artists.map((a: any) => a.name).join(", "),
              albumImage: item.track!.album?.images?.[item.track!.album.images.length - 1]?.url || "",
              duration: item.track!.duration_ms,
              originalIndex: index,
            }));
          setTotalTracks(playlistData.tracks.total);
        }

        setPlaylist(playlistInfo);
        setTracks(initialTracks);
        setOriginalOrder(initialTracks);
        setLoadedCount(initialTracks.length);
      } catch (error: any) {
        console.error("Failed to load playlist:", error);
        if (isSessionTimeoutError(error)) {
          handleSessionTimeout(router);
        } else {
          toast.error("Failed to load playlist");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylist();
  }, [playlistId, router, isLikedSongs]);

  // Prefetch next batch on hover
  async function prefetchNextBatch() {
    if (isPrefetching || prefetchedRef.current || loadedCount >= totalTracks) return;
    
    setIsPrefetching(true);
    prefetchedRef.current = true;

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      let newTracks: TrackItem[] = [];

      if (isLikedSongs) {
        const response = await sdk.currentUser.tracks.savedTracks(50, loadedCount);
        newTracks = response.items.map((item, index) => ({
          id: item.track.id,
          uri: item.track.uri,
          name: item.track.name,
          artists: item.track.artists.map((a) => a.name).join(", "),
          albumImage: item.track.album?.images?.[item.track.album.images.length - 1]?.url || "",
          duration: item.track.duration_ms,
          originalIndex: loadedCount + index,
        }));
      } else {
        const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, loadedCount);
        newTracks = response.items
          .filter((item) => item.track)
          .map((item, index) => ({
            id: item.track!.id,
            uri: item.track!.uri,
            name: item.track!.name,
            artists: item.track!.artists.map((a: any) => a.name).join(", "),
            albumImage: item.track!.album?.images?.[item.track!.album.images.length - 1]?.url || "",
            duration: item.track!.duration_ms,
            originalIndex: loadedCount + index,
          }));
      }

      setPrefetchedTracks(newTracks);
    } catch (error) {
      console.error("Prefetch failed:", error);
      prefetchedRef.current = false;
    } finally {
      setIsPrefetching(false);
    }
  }

  // Load more tracks
  async function loadMore() {
    if (isLoadingMore || loadedCount >= totalTracks) return;

    // Use prefetched data if available
    if (prefetchedTracks.length > 0) {
      setTracks((prev) => [...prev, ...prefetchedTracks]);
      setOriginalOrder((prev) => [...prev, ...prefetchedTracks]);
      setLoadedCount((prev) => prev + prefetchedTracks.length);
      setPrefetchedTracks([]);
      prefetchedRef.current = false;
      return;
    }

    setIsLoadingMore(true);
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      let newTracks: TrackItem[] = [];

      if (isLikedSongs) {
        const response = await sdk.currentUser.tracks.savedTracks(50, loadedCount);
        newTracks = response.items.map((item, index) => ({
          id: item.track.id,
          uri: item.track.uri,
          name: item.track.name,
          artists: item.track.artists.map((a) => a.name).join(", "),
          albumImage: item.track.album?.images?.[item.track.album.images.length - 1]?.url || "",
          duration: item.track.duration_ms,
          originalIndex: loadedCount + index,
        }));
      } else {
        const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, loadedCount);
        newTracks = response.items
          .filter((item) => item.track)
          .map((item, index) => ({
            id: item.track!.id,
            uri: item.track!.uri,
            name: item.track!.name,
            artists: item.track!.artists.map((a: any) => a.name).join(", "),
            albumImage: item.track!.album?.images?.[item.track!.album.images.length - 1]?.url || "",
            duration: item.track!.duration_ms,
            originalIndex: loadedCount + index,
          }));
      }

      setTracks((prev) => [...prev, ...newTracks]);
      setOriginalOrder((prev) => [...prev, ...newTracks]);
      setLoadedCount((prev) => prev + newTracks.length);
    } catch (error) {
      console.error("Failed to load more:", error);
      toast.error("Failed to load more tracks");
    } finally {
      setIsLoadingMore(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTracks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Check if order changed
        const orderChanged = newOrder.some((track, index) => track.id !== originalOrder[index]?.id);
        setHasChanges(orderChanged);
        
        return newOrder;
      });
    }
  }

  async function saveChanges() {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      if (isLikedSongs) {
        // For Liked Songs: We need to remove and re-add in new order
        // This is a workaround since Spotify doesn't support reordering liked songs
        toast.loading("Reordering Liked Songs...", { id: "save" });
        
        // Get all URIs in new order
        const urisInNewOrder = tracks.map((t) => t.uri);
        
        // Remove all tracks
        await sdk.currentUser.tracks.removeSavedTracks(tracks.map((t) => t.id));
        
        // Add back in reverse order (newest first in Liked Songs)
        const reversedUris = [...urisInNewOrder].reverse();
        for (let i = 0; i < reversedUris.length; i += 50) {
          const batch = reversedUris.slice(i, i + 50);
          await sdk.currentUser.tracks.saveTracks(batch.map((uri) => uri.split(":")[2]));
        }
        
        toast.success("Liked Songs reordered!", { id: "save" });
      } else {
        // For regular playlists: Use Spotify's reorder API
        toast.loading("Saving changes...", { id: "save" });
        
        // Find moves needed
        for (let i = 0; i < tracks.length; i++) {
          const track = tracks[i];
          const originalPos = originalOrder.findIndex((t) => t.id === track.id);
          
          if (originalPos !== i && originalPos !== -1) {
            await sdk.playlists.updatePlaylistItems(playlistId, {
              range_start: originalPos,
              insert_before: i > originalPos ? i + 1 : i,
            });
            // Update original order to reflect the move
            setOriginalOrder((prev) => arrayMove(prev, originalPos, i));
          }
        }
        
        toast.success("Changes saved!", { id: "save" });
      }

      setOriginalOrder([...tracks]);
      setHasChanges(false);
    } catch (error: any) {
      console.error("Failed to save:", error);
      toast.error("Failed to save changes", { id: "save" });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-spotify-green animate-spin mx-auto" />
            <p className="text-text-secondary">Loading playlist...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!playlist) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <p className="text-text-secondary">Playlist not found</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Toaster position="top-center" />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={isLikedSongs ? "/dashboard" : `/playlist/${playlistId}`}>
              <Button variant="ghost" className="p-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>

            {/* Playlist Info */}
            <div className="flex items-center gap-4">
              {isLikedSongs ? (
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-white fill-white" />
                </div>
              ) : playlist.image ? (
                <img src={playlist.image} alt={playlist.name} className="w-16 h-16 rounded-lg object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-background-tertiary flex items-center justify-center">
                  <Music className="w-8 h-8 text-text-tertiary" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Edit: {playlist.name}</h1>
                <p className="text-text-secondary">
                  {loadedCount}/{totalTracks} songs loaded • Drag to reorder
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={saveChanges}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 ${hasChanges ? "bg-spotify-green hover:bg-spotify-green-hover" : "bg-background-tertiary"}`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {/* Unsaved Changes Warning */}
        {hasChanges && (
          <div className="bg-accent-orange/10 border border-accent-orange/30 rounded-lg p-4">
            <p className="text-accent-orange text-sm">
              You have unsaved changes. Click "Save Changes" to apply them to Spotify.
            </p>
          </div>
        )}

        {/* Track List */}
        <div className="bg-background-secondary rounded-xl border border-border overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={tracks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border">
                {tracks.map((track, index) => (
                  <SortableTrack key={track.id} track={track} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Load More */}
          {loadedCount < totalTracks && (
            <div className="p-4 border-t border-border">
              <button
                onClick={loadMore}
                onMouseEnter={prefetchNextBatch}
                disabled={isLoadingMore}
                className="w-full py-3 px-4 bg-background-tertiary hover:bg-background-hover rounded-lg text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Load 50 More ({totalTracks - loadedCount} remaining)
              </button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
