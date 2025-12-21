import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface Track {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  uri: string;
  duration_ms: number;
  detectedLanguage?: "tamil" | "english" | "korean" | "other";
  detectedGenres?: string[];
}

export interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
  total: number;
  images: { url: string }[];
}

interface PlaylistState {
  // Selected playlists for workspace
  playlistA: Playlist | null;
  playlistB: Playlist | null;

  // All available playlists
  availablePlaylists: { id: string; name: string; images: { url: string }[]; total: number }[];

  // Drag mode
  dragMode: "copy" | "move";

  // Loading states
  isLoading: boolean;

  // Actions
  setPlaylistA: (playlist: Playlist | null) => void;
  setPlaylistB: (playlist: Playlist | null) => void;
  setAvailablePlaylists: (playlists: PlaylistState["availablePlaylists"]) => void;
  toggleDragMode: () => void;
  setDragMode: (mode: "copy" | "move") => void;
  setLoading: (loading: boolean) => void;

  // Track operations
  addTrackToPlaylist: (track: Track, side: "A" | "B") => void;
  removeTrackFromPlaylist: (trackId: string, side: "A" | "B") => void;
  appendTracksToPlaylist: (tracks: Track[], side: "A" | "B") => void;
}

export const usePlaylistStore = create<PlaylistState>()(
  devtools(
    (set) => ({
      playlistA: null,
      playlistB: null,
      availablePlaylists: [],
      dragMode: "copy",
      isLoading: false,

      setPlaylistA: (playlist) => set({ playlistA: playlist }),
      setPlaylistB: (playlist) => set({ playlistB: playlist }),
      setAvailablePlaylists: (playlists) => set({ availablePlaylists: playlists }),

      toggleDragMode: () =>
        set((state) => ({
          dragMode: state.dragMode === "copy" ? "move" : "copy",
        })),

      setDragMode: (mode) => set({ dragMode: mode }),
      setLoading: (loading) => set({ isLoading: loading }),

      addTrackToPlaylist: (track, side) =>
        set((state) => {
          const playlist = side === "A" ? state.playlistA : state.playlistB;
          if (!playlist) return state;

          // Check if track already exists
          if (playlist.tracks.some((t) => t.id === track.id)) {
            return state;
          }

          const updatedPlaylist = {
            ...playlist,
            tracks: [...playlist.tracks, track],
            total: playlist.total + 1,
          };

          return side === "A"
            ? { playlistA: updatedPlaylist }
            : { playlistB: updatedPlaylist };
        }),

      removeTrackFromPlaylist: (trackId, side) =>
        set((state) => {
          const playlist = side === "A" ? state.playlistA : state.playlistB;
          if (!playlist) return state;

          const updatedPlaylist = {
            ...playlist,
            tracks: playlist.tracks.filter((t) => t.id !== trackId),
            total: playlist.total - 1,
          };

          return side === "A"
            ? { playlistA: updatedPlaylist }
            : { playlistB: updatedPlaylist };
        }),

      appendTracksToPlaylist: (tracks, side) =>
        set((state) => {
          const playlist = side === "A" ? state.playlistA : state.playlistB;
          if (!playlist) return state;

          // Filter out duplicates
          const existingIds = new Set(playlist.tracks.map((t) => t.id));
          const newTracks = tracks.filter((t) => !existingIds.has(t.id));

          const updatedPlaylist = {
            ...playlist,
            tracks: [...playlist.tracks, ...newTracks],
          };

          return side === "A"
            ? { playlistA: updatedPlaylist }
            : { playlistB: updatedPlaylist };
        }),
    }),
    { name: "playlist-store" }
  )
);
