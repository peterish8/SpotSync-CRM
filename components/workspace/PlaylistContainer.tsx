"use client";

import { useDroppable } from "@dnd-kit/core";
import { SongCard } from "./SongCard";
import { Playlist } from "@/store/playlistStore";
import { Music } from "lucide-react";

interface PlaylistContainerProps {
  playlist: Playlist;
  side: "A" | "B";
}

// Calculate total duration
function formatTotalDuration(tracks: Playlist["tracks"]) {
  const totalMs = tracks.reduce((acc, t) => acc + t.duration_ms, 0);
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function PlaylistContainer({ playlist, side }: PlaylistContainerProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `playlist-${side}`,
    data: { playlistId: playlist.id, side },
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        flex-1 bg-background-tertiary rounded-xl p-6
        transition-all duration-200 min-h-[500px]
        ${isOver ? "ring-2 ring-spotify-green bg-spotify-green/5" : ""}
      `}
    >
      {/* Playlist Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          {playlist.images?.[0] ? (
            <img
              src={playlist.images[0].url}
              alt={playlist.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-background-secondary flex items-center justify-center">
              <Music className="w-8 h-8 text-text-tertiary" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-text-primary">{playlist.name}</h2>
            <p className="text-sm text-text-secondary">
              {playlist.tracks.length} songs • {formatTotalDuration(playlist.tracks)}
            </p>
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="space-y-2 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
        {playlist.tracks.length === 0 ? (
          <div className="text-center py-12 text-text-tertiary">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tracks yet</p>
            <p className="text-sm">Drag songs here to add them</p>
          </div>
        ) : (
          playlist.tracks.map((track) => (
            <SongCard key={track.id} track={track} playlistId={playlist.id} />
          ))
        )}
      </div>
    </div>
  );
}
