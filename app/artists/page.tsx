"use client";

import { useState, useEffect, useRef } from "react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Button, Card, CardContent } from "@/components/ui";
import { Users, Copy, Check, Loader2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { isSessionTimeoutError, handleSessionTimeout } from "@/lib/spotify/auth";

interface SimplifiedPlaylist {
  id: string;
  name: string;
  total: number;
}

export default function ArtistExtractorPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [artists, setArtists] = useState<Set<string>>(new Set());
  const [totalTracks, setTotalTracks] = useState(0);
  const [loadedTracks, setLoadedTracks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Prefetch state
  const [prefetchedArtists, setPrefetchedArtists] = useState<string[]>([]);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const prefetchRef = useRef<boolean>(false);

  useEffect(() => {
    async function loadPlaylists() {
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

        const response = await sdk.currentUser.playlists.playlists(50);
        const likedSongs = await sdk.currentUser.tracks.savedTracks(1);

        setPlaylists([
          { id: "liked-songs", name: "Liked Songs", total: likedSongs.total },
          ...response.items.map((p) => ({
            id: p.id,
            name: p.name,
            total: p.tracks?.total || 0,
          })),
        ]);
      } catch (error: any) {
        console.error("Failed to load playlists:", error);
        if (isSessionTimeoutError(error)) {
          handleSessionTimeout(router);
          return;
        }
        toast.error("Failed to load playlists");
      } finally {
        setIsLoading(false);
      }
    }
    loadPlaylists();
  }, [router]);

  async function handlePlaylistSelect(playlistId: string) {
    if (!playlistId) return;

    setSelectedPlaylist(playlistId);
    setArtists(new Set());
    setLoadedTracks(0);
    setPrefetchedArtists([]);
    setIsExtracting(true);

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      const artistSet = new Set<string>();
      
      // Get first 50 tracks
      let items: any[];
      let total: number;

      if (playlistId === "liked-songs") {
        const response = await sdk.currentUser.tracks.savedTracks(50, 0);
        items = response.items.map((item) => ({ track: item.track }));
        total = response.total;
      } else {
        const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, 50, 0);
        items = response.items;
        total = (await sdk.playlists.getPlaylist(playlistId)).tracks.total;
      }

      // Extract unique artists
      items.forEach((item) => {
        if (!item.track) return;
        item.track.artists.forEach((artist: any) => {
          artistSet.add(artist.name);
        });
      });

      setArtists(artistSet);
      setTotalTracks(total);
      setLoadedTracks(50);
      toast.success(`Loaded 50 tracks, found ${artistSet.size} unique artists`);
    } catch (error) {
      console.error("Failed to extract artists:", error);
      toast.error("Failed to extract artists");
    } finally {
      setIsExtracting(false);
    }
  }

  // Prefetch next 50 on hover
  async function prefetchNextBatch() {
    if (isPrefetching || prefetchRef.current || prefetchedArtists.length > 0) return;
    if (loadedTracks >= totalTracks) return;

    prefetchRef.current = true;
    setIsPrefetching(true);

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      let items: any[];

      if (selectedPlaylist === "liked-songs") {
        const response = await sdk.currentUser.tracks.savedTracks(50, loadedTracks);
        items = response.items.map((item) => ({ track: item.track }));
      } else {
        const response = await sdk.playlists.getPlaylistItems(selectedPlaylist, undefined, undefined, 50, loadedTracks);
        items = response.items;
      }

      const newArtists: string[] = [];
      items.forEach((item) => {
        if (!item.track) return;
        item.track.artists.forEach((artist: any) => {
          if (!artists.has(artist.name) && !newArtists.includes(artist.name)) {
            newArtists.push(artist.name);
          }
        });
      });

      setPrefetchedArtists(newArtists);
    } catch (error) {
      console.log("Prefetch failed silently");
    } finally {
      setIsPrefetching(false);
    }
  }

  // Load more (use prefetched data if available)
  async function loadMore() {
    if (loadedTracks >= totalTracks) return;

    // Use prefetched data
    if (prefetchedArtists.length > 0) {
      const newSet = new Set(artists);
      prefetchedArtists.forEach((a) => newSet.add(a));
      setArtists(newSet);
      setLoadedTracks((prev) => Math.min(prev + 50, totalTracks));
      setPrefetchedArtists([]);
      prefetchRef.current = false;
      toast.success(`Found ${prefetchedArtists.length} new unique artists`);
      return;
    }

    // Otherwise fetch fresh
    setIsExtracting(true);
    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      let items: any[];

      if (selectedPlaylist === "liked-songs") {
        const response = await sdk.currentUser.tracks.savedTracks(50, loadedTracks);
        items = response.items.map((item) => ({ track: item.track }));
      } else {
        const response = await sdk.playlists.getPlaylistItems(selectedPlaylist, undefined, undefined, 50, loadedTracks);
        items = response.items;
      }

      const newSet = new Set(artists);
      let newCount = 0;
      items.forEach((item) => {
        if (!item.track) return;
        item.track.artists.forEach((artist: any) => {
          if (!newSet.has(artist.name)) {
            newSet.add(artist.name);
            newCount++;
          }
        });
      });

      setArtists(newSet);
      setLoadedTracks((prev) => Math.min(prev + 50, totalTracks));
      toast.success(`Found ${newCount} new unique artists`);
    } catch (error) {
      console.error("Failed to load more:", error);
      toast.error("Failed to load more");
    } finally {
      setIsExtracting(false);
      prefetchRef.current = false;
    }
  }

  function copyToClipboard() {
    const text = Array.from(artists).sort().join(", ");
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }

  const artistsArray = Array.from(artists).sort();
  const hasMore = loadedTracks < totalTracks;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Toaster position="bottom-right" toastOptions={{ style: { background: "#181818", color: "#fff", border: "1px solid #282828" } }} />

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Users className="w-8 h-8 text-spotify-green" />
            Artist Extractor
          </h1>
          <p className="text-text-secondary mt-2">Extract all unique artist names from any playlist</p>
        </div>

        {/* Playlist Selector */}
        <Card>
          <CardContent className="p-6">
            <label className="block text-text-primary font-medium mb-3">Select Playlist</label>
            <select
              value={selectedPlaylist}
              onChange={(e) => handlePlaylistSelect(e.target.value)}
              className="w-full bg-background-tertiary text-text-primary px-4 py-3 rounded-lg border border-border focus:border-spotify-green focus:outline-none"
            >
              <option value="">Choose a playlist...</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.total} songs)</option>
              ))}
            </select>
          </CardContent>
        </Card>

        {isExtracting && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-spotify-green animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Extracting artist names...</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {!isExtracting && artists.size > 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-text-primary">
                    {artists.size} Unique Artists
                  </h2>
                  <p className="text-sm text-text-secondary">
                    From {loadedTracks}/{totalTracks} tracks
                  </p>
                </div>
                <Button variant="secondary" onClick={copyToClipboard} className="gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy All"}
                </Button>
              </div>

              {/* Artists Display */}
              <div className="bg-background-tertiary rounded-lg p-4 max-h-80 overflow-y-auto custom-scrollbar">
                <p className="text-text-primary leading-relaxed select-all">
                  {artistsArray.join(", ")}
                </p>
              </div>

              {/* Load More */}
              {hasMore && (
                <button
                  onClick={loadMore}
                  onMouseEnter={prefetchNextBatch}
                  disabled={isExtracting}
                  className="w-full py-3 mt-4 flex items-center justify-center gap-2 
                             bg-background-secondary hover:bg-background-hover 
                             text-text-secondary hover:text-text-primary
                             rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load 50 More ({totalTracks - loadedTracks} tracks remaining)
                </button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
