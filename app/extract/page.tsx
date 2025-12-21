"use client";

import { useState, useEffect } from "react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Button, Card, CardContent } from "@/components/ui";
import { Check, Loader2, Music, Filter, Plus, Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

// Tamil artists database
const TAMIL_ARTISTS = [
  "a.r. rahman", "anirudh ravichander", "yuvan shankar raja",
  "harris jayaraj", "santhosh narayanan", "ilaiyaraaja",
  "devi sri prasad", "g.v. prakash kumar", "d. imman", "sid sriram",
  "shreya ghoshal", "chinmayi", "haricharan", "pradeep kumar",
  "sean roldan", "hip hop tamizha", "vijay antony", "leon james",
  "d imman", "c. sathya", "sam c.s.", "c sathya", "ghibran",
];

// K-pop patterns
const KPOP_PATTERNS = [
  "bts", "blackpink", "exo", "twice", "iu", "newjeans",
  "stray kids", "seventeen", "red velvet", "itzy", "enhypen",
  "aespa", "nct", "txt", "le sserafim", "ive", "gidle",
  "(g)i-dle", "monsta x", "got7", "mamamoo", "bigbang",
];

// Hindi artists
const HINDI_ARTISTS = [
  "arijit singh", "shreya ghoshal", "neha kakkar", "badshah",
  "a.r. rahman", "pritam", "amit trivedi", "vishal-shekhar",
  "atif aslam", "honey singh", "kumar sanu", "sonu nigam",
  "jubin nautiyal", "armaan malik", "darshan raval",
];

// Language detection regex
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;
const HINDI_REGEX = /[\u0900-\u097F]/;

interface Genre {
  id: string;
  name: string;
  count: number;
  trackUris: string[];
  color: string;
}

interface SimplifiedPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  total: number;
}

interface TrackItem {
  track: {
    id: string;
    name: string;
    uri: string;
    artists: { id: string; name: string }[];
  } | null;
}

function detectLanguage(trackName: string, artistNames: string[]): string {
  const lowerArtists = artistNames.map((a) => a.toLowerCase());
  const lowerTrack = trackName.toLowerCase();

  // Check Tamil
  if (lowerArtists.some((name) => TAMIL_ARTISTS.some((ta) => name.includes(ta)))) {
    return "tamil";
  }
  if (TAMIL_REGEX.test(trackName)) return "tamil";

  // Check Hindi
  if (lowerArtists.some((name) => HINDI_ARTISTS.some((ha) => name.includes(ha)))) {
    return "hindi";
  }
  if (HINDI_REGEX.test(trackName)) return "hindi";

  // Check K-pop
  if (lowerArtists.some((name) => KPOP_PATTERNS.some((kp) => name.includes(kp)))) {
    return "korean";
  }
  if (KOREAN_REGEX.test(trackName)) return "korean";

  // Default to English
  return "english";
}

function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    tamil: "#F97316",
    english: "#3B82F6",
    korean: "#8B5CF6",
    hindi: "#EC4899",
    pop: "#EC4899",
    rock: "#EF4444",
    "hip-hop": "#F59E0B",
    edm: "#10B981",
    indie: "#6366F1",
    jazz: "#FBBF24",
    classical: "#A78BFA",
  };
  return colors[genre.toLowerCase()] || "#6B7280";
}

export default function GenreExtractPage() {
  const router = useRouter();
  const [playlists, setPlaylists] = useState<SimplifiedPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  // Load playlists on mount
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
          {
            id: "liked-songs",
            name: "Liked Songs",
            images: [],
            total: likedSongs.total,
          },
          ...response.items.map((p) => ({
            id: p.id,
            name: p.name,
            images: p.images || [],
            total: p.tracks?.total || 0,
          })),
        ]);
      } catch (error) {
        console.error("Failed to load playlists:", error);
        toast.error("Failed to load playlists");
      } finally {
        setIsLoading(false);
      }
    }

    loadPlaylists();
  }, [router]);

  // Analyze playlist when selected
  async function handlePlaylistSelect(playlistId: string) {
    if (!playlistId) return;

    setSelectedPlaylist(playlistId);
    setIsAnalyzing(true);
    setGenres([]);
    setSelectedGenres(new Set());

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      const genreMap = new Map<string, Set<string>>();
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      // Fetch all tracks with pagination
      while (hasMore) {
        let items: TrackItem[];

        if (playlistId === "liked-songs") {
          const response = await sdk.currentUser.tracks.savedTracks(limit, offset);
          items = response.items.map((item) => ({ track: item.track }));
          hasMore = response.next !== null;
        } else {
          const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset);
          items = response.items;
          hasMore = response.next !== null;
        }

        // Analyze each track
        items.forEach((item) => {
          if (!item.track) return;

          const artistNames = item.track.artists.map((a) => a.name);
          const language = detectLanguage(item.track.name, artistNames);

          if (!genreMap.has(language)) {
            genreMap.set(language, new Set());
          }
          genreMap.get(language)!.add(item.track.uri);
        });

        offset += limit;
      }

      // Convert to array
      const genreList: Genre[] = Array.from(genreMap.entries()).map(([name, trackUris]) => ({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: trackUris.size,
        trackUris: Array.from(trackUris),
        color: getGenreColor(name),
      }));

      // Sort by count
      genreList.sort((a, b) => b.count - a.count);

      setGenres(genreList);
      toast.success(`Found ${genreList.length} languages/genres`);
    } catch (error) {
      console.error("Analysis failed:", error);
      toast.error("Failed to analyze playlist");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function toggleGenre(genreId: string) {
    const newSelected = new Set(selectedGenres);
    if (newSelected.has(genreId)) {
      newSelected.delete(genreId);
    } else {
      newSelected.add(genreId);
    }
    setSelectedGenres(newSelected);

    // Auto-generate playlist name
    const selectedNames = genres
      .filter((g) => newSelected.has(g.id))
      .map((g) => g.name);
    setNewPlaylistName(selectedNames.length > 0 ? `${selectedNames.join(" + ")} Mix` : "");
  }

  function getTotalSelectedSongs(): number {
    const allUris = new Set<string>();
    genres
      .filter((g) => selectedGenres.has(g.id))
      .forEach((g) => g.trackUris.forEach((uri) => allUris.add(uri)));
    return allUris.size;
  }

  async function extractToPlaylist() {
    if (selectedGenres.size === 0) {
      toast.error("Select at least one genre");
      return;
    }

    if (!newPlaylistName.trim()) {
      toast.error("Enter a playlist name");
      return;
    }

    setIsCreating(true);

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      // Collect all track URIs
      const allUris = new Set<string>();
      genres
        .filter((g) => selectedGenres.has(g.id))
        .forEach((g) => g.trackUris.forEach((uri) => allUris.add(uri)));

      const trackUrisArray = Array.from(allUris);

      // Get user ID
      const user = await sdk.currentUser.profile();

      // Create playlist
      const newPlaylist = await sdk.playlists.createPlaylist(user.id, {
        name: newPlaylistName.trim(),
        description: `Auto-generated by SyncSpot Genre Extraction Tool`,
        public: false,
      });

      // Add tracks in batches of 100
      for (let i = 0; i < trackUrisArray.length; i += 100) {
        const batch = trackUrisArray.slice(i, i + 100);
        await sdk.playlists.addItemsToPlaylist(newPlaylist.id, batch);
      }

      toast.success(`Created "${newPlaylistName}" with ${trackUrisArray.length} songs!`);

      // Reset
      setSelectedGenres(new Set());
      setNewPlaylistName("");
    } catch (error: any) {
      console.error("Failed to create playlist:", error);
      toast.error(error.message || "Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-text-secondary">Loading...</p>
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
          style: { background: "#181818", color: "#fff", border: "1px solid #282828" },
        }}
      />

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Filter className="w-8 h-8 text-spotify-green" />
            Genre Extraction Tool
          </h1>
          <p className="text-text-secondary mt-2">
            Select a playlist, choose languages/genres, and create a filtered playlist
          </p>
        </div>

        {/* Playlist Selector */}
        <Card>
          <CardContent className="p-6">
            <label className="block text-text-primary font-medium mb-3">Select Playlist to Analyze</label>
            <select
              value={selectedPlaylist}
              onChange={(e) => handlePlaylistSelect(e.target.value)}
              className="w-full bg-background-tertiary text-text-primary px-4 py-3 rounded-lg border border-border focus:border-spotify-green focus:outline-none focus:ring-2 focus:ring-spotify-green/20"
            >
              <option value="">Choose a playlist...</option>
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name} ({playlist.total} songs)
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Analyzing State */}
        {isAnalyzing && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-spotify-green animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Analyzing all songs for languages/genres...</p>
              <p className="text-text-tertiary text-sm mt-2">This may take a moment for large playlists</p>
            </CardContent>
          </Card>
        )}

        {/* Genre List */}
        {!isAnalyzing && genres.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">
                Detected Languages/Genres ({genres.length})
              </h2>

              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {genres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => toggleGenre(genre.id)}
                    className={`
                      w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200
                      ${
                        selectedGenres.has(genre.id)
                          ? "bg-spotify-green/20 border-2 border-spotify-green"
                          : "bg-background-tertiary hover:bg-background-hover border-2 border-transparent"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: genre.color }}
                      />
                      <span className="font-medium text-text-primary">{genre.name}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm text-text-secondary">{genre.count} songs</span>
                      {selectedGenres.has(genre.id) && <Check className="w-5 h-5 text-spotify-green" />}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extract Section */}
        {genres.length > 0 && selectedGenres.size > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-primary font-medium">
                    {selectedGenres.size} genre{selectedGenres.size > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-sm text-text-secondary">{getTotalSelectedSongs()} unique songs</p>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">New Playlist Name</label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Playlist Mix"
                  className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-spotify-green focus:border-transparent"
                />
              </div>

              <Button
                variant="primary"
                className="w-full py-4 text-lg"
                onClick={extractToPlaylist}
                isLoading={isCreating}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Playlist
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isAnalyzing && genres.length === 0 && selectedPlaylist && (
          <Card>
            <CardContent className="p-12 text-center">
              <Music className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No genres detected in this playlist</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
