"use client";

import { useState, useEffect } from "react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { MainLayout } from "@/components/layout";
import { Button, Card, CardContent, Modal } from "@/components/ui";
import { Check, Loader2, Music, Filter, Plus, Eye, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

// ====== SPOTIFY-MATCHED CANONICAL ARTIST LISTS (110+ TAMIL ARTISTS) ======

// TAMIL ARTISTS - Exact Spotify display names
const TAMIL_ARTISTS = [
  // Music Directors / Composers
  "a.r. rahman", "anirudh ravichander", "d. imman", "deva", "g. v. prakash",
  "ghibran", "harris jayaraj", "ilaiyaraaja", "justin prabhakaran", "leon james",
  "sam c.s.", "santhosh narayanan", "sean roldan", "vijay antony", "vishal chandrashekhar",
  "vivek - mervin", "yuvan shankar raja", "govind vasantha", "dhibu ninan thomas",
  "ravi basrur", "sushin shyam", "vishnu vijay",
  
  // Male Playback / Indie / Rap
  "abishek suresh", "adithya rk", "anand aravindakshan", "ananthu", "anthony daasan",
  "arivu", "arjun chandy", "arunraja kamaraj", "asal kolaar", "deepak blue",
  "dhanush", "gana bala", "gana balachandar", "gana guna", "gana kadhar",
  "hariharan", "haricharan", "hiphop tamizha", "hiphop tamizha aadhi", "karthik",
  "nakul abhyankar", "naresh iyer", "nivas", "pradeep kumar", "rokesh",
  "silambarasan tr", "sivakarthikeyan", "sooraj santhosh", "srinivas", "tippu",
  "unni menon", "velmurugan", "yogi sekar", "sid sriram", "s. p. balasubrahmanyam",
  "vijay yesudas", "shankar mahadevan",
  
  // Female Playback / Indie
  "aditi shankar", "anuradha sriram", "aparna narayanan", "chinmayi", "dhee",
  "jonita gandhi", "maanasi g kannan", "padmalatha", "prarthana sriram", "prashanthini",
  "rakshita suresh", "saindhavi", "sanah moidutty", "sashaa thirupati", "shakthisree gopalan",
  "shreya ghoshal", "shruti haasan", "shweta mohan", "sithara krishnakumar",
  "srinidhi venkatesh", "sunitha sarathy", "tanvi shah", "vaikom vijayalakshmi",
  "vani jairam", "swetha mohan", "k. s. chithra", "andrea jeremiah", "sadhana sargam",
  
  // Lyricists / Writers
  "kabilan", "ko. sesha", "madhan karky", "madan karky", "na. muthukumar",
  "pa. vijay", "snehan", "thamarai", "vaali", "vairamuthu", "vivek", "viveka",
  "yugabharathi", "vishnu edavan",
  
  // Actor-Singers
  "kamal haasan", "thalapathy vijay", "vijay", "vikram", "santhanam",
  
  // Additional Indie / Folk
  "ofro", "paal dabba", "srinisha jayaseelan", "hip hop tamizha",
];

// K-POP ARTISTS - Exact Spotify display names (checked FIRST - highest priority)
const KPOP_ARTISTS = [
  // TOP-TIER MALE GROUPS
  "bts", "exo", "seventeen", "stray kids", "ateez", "txt",
  "nct", "nct 127", "nct dream", "enhypen", "monsta x", "got7",
  "bigbang", "ikon", "treasure", "shinee", "the boyz",
  
  // TOP-TIER FEMALE GROUPS
  "blackpink", "twice", "red velvet", "itzy", "aespa", "ive",
  "le sserafim", "newjeans", "(g)i-dle", "stayc", "illit",
  "babymonster", "oh my girl", "mamamoo",
  
  // MALE SOLOISTS
  "jungkook", "v", "jimin", "rm", "agust d", "baekhyun",
  "taemin", "kai", "zico", "psy", "g-dragon", "jay park",
  
  // FEMALE SOLOISTS
  "iu", "jennie", "rosé", "lisa", "chung ha", "sunmi",
  "taeyeon", "hwasa", "jeon somi", "heize", "bibi",
  
  // K-HIPHOP / K-R&B (still K-pop category)
  "dean", "crush", "loco", "gray", "ash island", "epik high",
];

// HINDI ARTISTS - Exact Spotify display names (NO overlap with Tamil)
const HINDI_ARTISTS = [
  "arijit singh", "neha kakkar", "badshah", "pritam",
  "amit trivedi", "vishal-shekhar", "atif aslam", "honey singh",
  "kumar sanu", "sonu nigam", "jubin nautiyal", "armaan malik",
  "darshan raval", "shreya ghoshal", // Shreya is mostly Hindi
];

// ENGLISH ARTISTS - Canonical Spotify list (80+ artists)
const ENGLISH_ARTISTS = [
  // POP / MAINSTREAM
  "taylor swift", "ed sheeran", "ariana grande", "justin bieber", "the weeknd",
  "dua lipa", "billie eilish", "olivia rodrigo", "selena gomez", "shawn mendes",
  "camila cabello", "harry styles", "zayn", "miley cyrus", "lady gaga",
  "katy perry", "rihanna", "bruno mars", "sia", "adele",
  
  // HIP-HOP / RAP
  "drake", "post malone", "travis scott", "kanye west", "eminem",
  "kendrick lamar", "j. cole", "jay-z", "future", "lil wayne",
  "doja cat", "nicki minaj", "cardi b", "21 savage", "logic",
  
  // ROCK / ALTERNATIVE / INDIE
  "coldplay", "imagine dragons", "onerepublic", "maroon 5", "linkin park",
  "green day", "the chainsmokers", "arctic monkeys", "the 1975",
  "panic! at the disco", "fall out boy", "radiohead", "u2", "the killers", "foo fighters",
  
  // EDM / ELECTRONIC
  "calvin harris", "avicii", "alan walker", "martin garrix", "zedd",
  "kygo", "marshmello", "david guetta", "tiësto", "deadmau5",
  
  // R&B / SOUL / ALT-POP
  "frank ocean", "sam smith", "halsey", "lana del rey", "charlie puth",
  "john legend", "usher", "chris brown", "the neighbourhood", "tate mcrae",
  
  // ADDITIONAL TOP ARTISTS
  "lauv", "ava max", "bebe rexha", "niall horan", "louis tomlinson",
  "james arthur", "lewis capaldi", "hozier", "troye sivan", "glass animals",
];

// Unicode character ranges for script detection
const TAMIL_REGEX = /[\u0B80-\u0BFF]/;
const KOREAN_REGEX = /[\uAC00-\uD7AF]/;
const HINDI_REGEX = /[\u0900-\u097F]/;

interface TrackInfo {
  uri: string;
  name: string;
  artists: string;
  albumImage: string;
}

interface Genre {
  id: string;
  name: string;
  count: number;
  tracks: TrackInfo[];
  color: string;
}

interface SimplifiedPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  total: number;
}

// DETECTION ORDER MATTERS! Korean first (most distinct), then Tamil, then Hindi, else English
function detectLanguage(trackName: string, artistNames: string[]): string {
  const lowerArtists = artistNames.map((a) => a.toLowerCase().trim());

  // 1. K-POP FIRST (most distinct, avoid false positives)
  if (KOREAN_REGEX.test(trackName)) return "korean";
  if (lowerArtists.some((name) => KPOP_ARTISTS.some((kp) => name.includes(kp)))) return "korean";

  // 2. TAMIL (strong composer/singer match)
  if (TAMIL_REGEX.test(trackName)) return "tamil";
  if (lowerArtists.some((name) => TAMIL_ARTISTS.some((ta) => name.includes(ta)))) return "tamil";

  // 3. HINDI
  if (HINDI_REGEX.test(trackName)) return "hindi";
  if (lowerArtists.some((name) => HINDI_ARTISTS.some((ha) => name.includes(ha)))) return "hindi";

  // 4. DEFAULT: English
  return "english";
}


function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    tamil: "#F97316", english: "#3B82F6", korean: "#8B5CF6", hindi: "#EC4899",
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
  
  // Preview modal state
  const [previewGenre, setPreviewGenre] = useState<Genre | null>(null);
  
  // Target playlist options
  const [targetMode, setTargetMode] = useState<"new" | "existing">("new");
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [targetPlaylistId, setTargetPlaylistId] = useState("");

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
          { id: "liked-songs", name: "Liked Songs", images: [], total: likedSongs.total },
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

      const genreMap = new Map<string, TrackInfo[]>();
      let offset = 0;
      const limit = 50;
      let hasMore = true;

      while (hasMore) {
        let items: any[];

        if (playlistId === "liked-songs") {
          const response = await sdk.currentUser.tracks.savedTracks(limit, offset);
          items = response.items.map((item) => ({ track: item.track }));
          hasMore = response.next !== null;
        } else {
          const response = await sdk.playlists.getPlaylistItems(playlistId, undefined, undefined, limit, offset);
          items = response.items;
          hasMore = response.next !== null;
        }

        items.forEach((item) => {
          if (!item.track) return;

          const artistNames = item.track.artists.map((a: any) => a.name);
          const language = detectLanguage(item.track.name, artistNames);

          const trackInfo: TrackInfo = {
            uri: item.track.uri,
            name: item.track.name,
            artists: artistNames.join(", "),
            albumImage: item.track.album?.images?.[item.track.album.images.length - 1]?.url || "",
          };

          if (!genreMap.has(language)) {
            genreMap.set(language, []);
          }
          // Avoid duplicates
          if (!genreMap.get(language)!.some((t) => t.uri === trackInfo.uri)) {
            genreMap.get(language)!.push(trackInfo);
          }
        });

        offset += limit;
      }

      const genreList: Genre[] = Array.from(genreMap.entries()).map(([name, tracks]) => ({
        id: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        count: tracks.length,
        tracks,
        color: getGenreColor(name),
      }));

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

    const selectedNames = genres.filter((g) => newSelected.has(g.id)).map((g) => g.name);
    setNewPlaylistName(selectedNames.length > 0 ? `${selectedNames.join(" + ")} Mix` : "");
  }

  function getTotalSelectedSongs(): number {
    const allUris = new Set<string>();
    genres.filter((g) => selectedGenres.has(g.id)).forEach((g) => g.tracks.forEach((t) => allUris.add(t.uri)));
    return allUris.size;
  }

  async function extractToPlaylist() {
    if (selectedGenres.size === 0) {
      toast.error("Select at least one genre");
      return;
    }

    if (targetMode === "new" && !newPlaylistName.trim()) {
      toast.error("Enter a playlist name");
      return;
    }

    if (targetMode === "existing" && !targetPlaylistId) {
      toast.error("Select a target playlist");
      return;
    }

    setIsCreating(true);

    try {
      const sdk = SpotifyApi.withUserAuthorization(
        process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
        process.env.NEXT_PUBLIC_REDIRECT_URI!,
        [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify]
      );

      const allUris = new Set<string>();
      genres.filter((g) => selectedGenres.has(g.id)).forEach((g) => g.tracks.forEach((t) => allUris.add(t.uri)));
      const trackUrisArray = Array.from(allUris);

      let playlistId: string;
      let playlistName: string;

      if (targetMode === "new") {
        const user = await sdk.currentUser.profile();
        const newPlaylist = await sdk.playlists.createPlaylist(user.id, {
          name: newPlaylistName.trim(),
          description: `Auto-generated by SyncSpot Genre Extraction Tool`,
          public: false,
        });
        playlistId = newPlaylist.id;
        playlistName = newPlaylistName.trim();
      } else {
        playlistId = targetPlaylistId;
        playlistName = playlists.find((p) => p.id === targetPlaylistId)?.name || "playlist";
      }

      // Add tracks in batches
      for (let i = 0; i < trackUrisArray.length; i += 100) {
        const batch = trackUrisArray.slice(i, i + 100);
        await sdk.playlists.addItemsToPlaylist(playlistId, batch);
      }

      toast.success(`Added ${trackUrisArray.length} songs to "${playlistName}"!`);
      setSelectedGenres(new Set());
      setNewPlaylistName("");
    } catch (error: any) {
      console.error("Failed:", error);
      toast.error(error.message || "Failed");
    } finally {
      setIsCreating(false);
    }
  }

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

      {/* Preview Modal */}
      <Modal isOpen={!!previewGenre} onClose={() => setPreviewGenre(null)} title={`${previewGenre?.name} Songs (${previewGenre?.count})`} size="lg">
        <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
          {previewGenre?.tracks.map((track, idx) => (
            <div key={track.uri} className="flex items-center gap-3 p-2 rounded-lg hover:bg-background-hover">
              <span className="text-text-tertiary text-sm w-6">{idx + 1}</span>
              {track.albumImage ? (
                <img src={track.albumImage} alt="" className="w-10 h-10 rounded" />
              ) : (
                <div className="w-10 h-10 rounded bg-background-tertiary flex items-center justify-center">
                  <Music className="w-4 h-4 text-text-tertiary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-text-primary truncate font-medium">{track.name}</p>
                <p className="text-text-secondary text-sm truncate">{track.artists}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Filter className="w-8 h-8 text-spotify-green" />
            Genre Extraction Tool
          </h1>
          <p className="text-text-secondary mt-2">Select a playlist, preview songs by genre, and add to any playlist</p>
        </div>

        {/* Playlist Selector */}
        <Card>
          <CardContent className="p-6">
            <label className="block text-text-primary font-medium mb-3">Select Playlist to Analyze</label>
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

        {isAnalyzing && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-spotify-green animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Analyzing songs...</p>
            </CardContent>
          </Card>
        )}

        {/* Genre List with Preview */}
        {!isAnalyzing && genres.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold text-text-primary mb-4">Detected Languages/Genres</h2>
              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {genres.map((genre) => (
                  <div
                    key={genre.id}
                    className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                      selectedGenres.has(genre.id)
                        ? "bg-spotify-green/20 border-2 border-spotify-green"
                        : "bg-background-tertiary hover:bg-background-hover border-2 border-transparent"
                    }`}
                  >
                    <button onClick={() => toggleGenre(genre.id)} className="flex items-center gap-3 flex-1">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: genre.color }} />
                      <span className="font-medium text-text-primary">{genre.name}</span>
                      <span className="text-sm text-text-secondary">({genre.count} songs)</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Preview Button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); setPreviewGenre(genre); }}
                        className="p-2 rounded-lg hover:bg-background-hover text-text-secondary hover:text-text-primary transition-colors"
                        title="Preview songs"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {selectedGenres.has(genre.id) && <Check className="w-5 h-5 text-spotify-green" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extract Section */}
        {genres.length > 0 && selectedGenres.size > 0 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-text-primary font-medium">{selectedGenres.size} genre(s) selected</p>
                <p className="text-sm text-text-secondary">{getTotalSelectedSongs()} unique songs</p>
              </div>

              {/* Target Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTargetMode("new")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    targetMode === "new" ? "bg-spotify-green text-black" : "bg-background-tertiary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Create New Playlist
                </button>
                <button
                  onClick={() => setTargetMode("existing")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    targetMode === "existing" ? "bg-spotify-green text-black" : "bg-background-tertiary text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Add to Existing
                </button>
              </div>

              {/* New Playlist Name */}
              {targetMode === "new" && (
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="New Playlist Name"
                  className="w-full px-4 py-3 bg-background-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-spotify-green"
                />
              )}

              {/* Existing Playlist Selector */}
              {targetMode === "existing" && (
                <select
                  value={targetPlaylistId}
                  onChange={(e) => setTargetPlaylistId(e.target.value)}
                  className="w-full bg-background-tertiary text-text-primary px-4 py-3 rounded-lg border border-border focus:border-spotify-green focus:outline-none"
                >
                  <option value="">Select target playlist...</option>
                  {playlists.filter((p) => p.id !== "liked-songs" && p.id !== selectedPlaylist).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              <Button variant="primary" className="w-full py-4 text-lg" onClick={extractToPlaylist} isLoading={isCreating}>
                <Plus className="w-5 h-5 mr-2" />
                {targetMode === "new" ? "Create New Playlist" : "Add to Playlist"}
              </Button>
            </CardContent>
          </Card>
        )}

        {!isAnalyzing && genres.length === 0 && selectedPlaylist && (
          <Card>
            <CardContent className="p-12 text-center">
              <Music className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
              <p className="text-text-secondary">No genres detected</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
