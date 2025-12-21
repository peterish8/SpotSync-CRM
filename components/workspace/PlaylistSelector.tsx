"use client";

import { useState } from "react";
import { ChevronDown, Music, Plus, X, Lock, Heart } from "lucide-react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { usePlaylistStore } from "@/store/playlistStore";
import { Button } from "@/components/ui";
import toast from "react-hot-toast";

interface PlaylistSelectorProps {
  side: "A" | "B";
  onSelect: (playlistId: string) => void;
}

export function PlaylistSelector({ side, onSelect }: PlaylistSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { availablePlaylists, playlistA, playlistB, setAvailablePlaylists } = usePlaylistStore();

  const currentPlaylist = side === "A" ? playlistA : playlistB;
  const otherPlaylistId = side === "A" ? playlistB?.id : playlistA?.id;

  // Sort playlists: Liked Songs first, then alphabetical
  const sortedPlaylists = [...availablePlaylists].sort((a, b) => {
    // Liked Songs always first
    if (a.name === "Liked Songs") return -1;
    if (b.name === "Liked Songs") return 1;
    return a.name.localeCompare(b.name);
  });

  // Filter playlists by search term
  const filteredPlaylists = sortedPlaylists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  async function handleCreatePlaylist() {
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }

    setCreating(true);
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      // Get current user ID
      const user = await sdk.currentUser.profile();

      // Create the playlist
      const newPlaylist = await sdk.playlists.createPlaylist(user.id, {
        name: newPlaylistName.trim(),
        description: "Created with SyncSpot CRM",
        public: false,
      });

      // Add to available playlists
      setAvailablePlaylists([
        {
          id: newPlaylist.id,
          name: newPlaylist.name,
          images: newPlaylist.images || [],
          total: 0,
        },
        ...availablePlaylists,
      ]);

      // Auto-select the new playlist
      onSelect(newPlaylist.id);

      toast.success(`Created "${newPlaylist.name}"`);
      setShowCreateModal(false);
      setNewPlaylistName("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to create playlist:", error);
      toast.error(error.message || "Failed to create playlist");
    } finally {
      setCreating(false);
    }
  }

  // Reset search when dropdown closes
  function handleClose() {
    setIsOpen(false);
    setSearchTerm("");
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 p-4 bg-background-secondary rounded-xl border border-border hover:border-text-tertiary transition-colors"
      >
        <div className="flex items-center gap-3">
          {currentPlaylist?.images?.[0] ? (
            <img
              src={currentPlaylist.images[0].url}
              alt={currentPlaylist.name}
              className="w-10 h-10 rounded-lg object-cover"
            />
          ) : currentPlaylist?.name === "Liked Songs" ? (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-background-tertiary flex items-center justify-center">
              <Music className="w-5 h-5 text-text-tertiary" />
            </div>
          )}
          <div className="text-left">
            <p className="font-medium text-text-primary">
              {currentPlaylist?.name || `Select Playlist ${side}`}
            </p>
            {currentPlaylist && (
              <p className="text-xs text-text-secondary">{currentPlaylist.total} tracks</p>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-text-secondary transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-border rounded-xl shadow-xl z-50 max-h-96 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <input
                type="text"
                placeholder="Search playlists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-background-tertiary border border-border rounded-lg text-text-primary text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto flex-1">
              {/* Create New Playlist Option */}
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  handleClose();
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-background-hover transition-colors border-b border-border text-spotify-green"
              >
                <div className="w-10 h-10 rounded bg-spotify-green/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-spotify-green" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Create New Playlist</p>
                  <p className="text-xs text-text-secondary">Start fresh with an empty playlist</p>
                </div>
              </button>

              {/* Existing Playlists */}
              {filteredPlaylists.length === 0 ? (
                <div className="p-4 text-center text-text-tertiary">No playlists found</div>
              ) : (
                filteredPlaylists.map((playlist) => {
                const isLocked = playlist.id === otherPlaylistId;
                const isSelected = currentPlaylist?.id === playlist.id;
                const isLikedSongs = playlist.name === "Liked Songs";

                return (
                  <button
                    key={playlist.id}
                    onClick={() => {
                      if (!isLocked) {
                        onSelect(playlist.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isLocked}
                    className={`w-full flex items-center gap-3 p-3 transition-colors ${
                      isLocked
                        ? "opacity-50 cursor-not-allowed bg-background-tertiary"
                        : "hover:bg-background-hover"
                    } ${isSelected ? "bg-spotify-green/10" : ""}`}
                  >
                    {isLikedSongs ? (
                      <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-700 to-blue-300 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-white fill-white" />
                      </div>
                    ) : playlist.images?.[0] ? (
                      <img
                        src={playlist.images[0].url}
                        alt={playlist.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-background-tertiary flex items-center justify-center">
                        <Music className="w-5 h-5 text-text-tertiary" />
                      </div>
                    )}
                    <div className="text-left flex-1">
                      <p className="font-medium text-text-primary truncate">{playlist.name}</p>
                      <p className="text-xs text-text-secondary">{playlist.total} tracks</p>
                    </div>
                    {isLocked && (
                      <div className="flex items-center gap-1 text-text-tertiary">
                        <Lock className="w-4 h-4" />
                        <span className="text-xs">In use</span>
                      </div>
                    )}
                  </button>
                );
              })
              )}
            </div>
          </div>
        </>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md bg-background-secondary rounded-xl border border-border shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-text-primary">Create New Playlist</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg hover:bg-background-hover transition-colors"
                >
                  <X className="w-5 h-5 text-text-secondary" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Playlist Name
                  </label>
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="My Awesome Playlist"
                    className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreatePlaylist();
                    }}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleCreatePlaylist}
                    isLoading={creating}
                  >
                    Create Playlist
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
