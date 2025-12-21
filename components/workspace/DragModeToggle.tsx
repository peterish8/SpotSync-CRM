"use client";

import { Copy, ArrowRightLeft } from "lucide-react";
import { usePlaylistStore } from "@/store/playlistStore";

export function DragModeToggle() {
  const { dragMode, setDragMode } = usePlaylistStore();

  return (
    <div className="flex items-center gap-1 bg-background-secondary p-1 rounded-full border border-border">
      <button
        onClick={() => setDragMode("copy")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          transition-all duration-200 font-medium text-sm
          ${
            dragMode === "copy"
              ? "bg-spotify-green text-black"
              : "text-text-secondary hover:text-text-primary"
          }
        `}
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>

      <button
        onClick={() => setDragMode("move")}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full
          transition-all duration-200 font-medium text-sm
          ${
            dragMode === "move"
              ? "bg-spotify-green text-black"
              : "text-text-secondary hover:text-text-primary"
          }
        `}
      >
        <ArrowRightLeft className="w-4 h-4" />
        Move
      </button>
    </div>
  );
}
