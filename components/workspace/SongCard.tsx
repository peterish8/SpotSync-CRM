"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Music, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui";
import { Track } from "@/store/playlistStore";

interface SongCardProps {
  track: Track;
  playlistId: string;
}

export function SongCard({ track, playlistId }: SongCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: track.id,
    data: {
      track,
      sourcePlaylistId: playlistId,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  // Format duration
  const duration = Math.floor(track.duration_ms / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  // Language badge variant
  const languageVariant = track.detectedLanguage || "default";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg
        bg-background-secondary hover:bg-background-hover
        border border-transparent hover:border-border
        transition-all duration-150 cursor-grab active:cursor-grabbing
        ${isDragging ? "ring-2 ring-spotify-green shadow-lg" : ""}
      `}
      {...attributes}
      {...listeners}
    >
      {/* Drag Handle */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-text-tertiary" />
      </div>

      {/* Album Art */}
      <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
        {track.album.images[0] ? (
          <img
            src={track.album.images[0].url}
            alt={track.album.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-background-tertiary flex items-center justify-center">
            <Music className="w-6 h-6 text-text-tertiary" />
          </div>
        )}
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-primary truncate">{track.name}</p>
        <p className="text-sm text-text-secondary truncate">
          {track.artists.map((a) => a.name).join(", ")}
        </p>
      </div>

      {/* Tags & Duration */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {track.detectedLanguage && track.detectedLanguage !== "other" && (
          <Badge variant={languageVariant as any}>{track.detectedLanguage}</Badge>
        )}
        <span className="text-xs text-text-tertiary tabular-nums">
          {minutes}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
    </div>
  );
}
