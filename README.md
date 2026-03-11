<p align="center">
  <h1 align="center">🎵 SyncSpot CRM</h1>
  <p align="center">
    <strong>Professional Spotify Playlist Management Tool</strong>
  </p>
  <p align="center">
    Extract genres · Drag & drop tracks · Manage your music library like never before
  </p>
</p>

---

## 🚀 Overview

**SyncSpot CRM** is a full-stack web application built with **Next.js 16** and the **Spotify Web API** that gives you complete control over your Spotify library. It lets you organize playlists with drag-and-drop, automatically detect the language/genre of every song through a curated artist database, extract unique artist names, reorder tracks, and create new playlists — all synced instantly to your Spotify account.

> **100% Free · Instant Spotify Sync · 5+ Languages Detected**

---

## 🌟 What Makes It Special — For Users

Most Spotify tools only let you view your library. SyncSpot CRM lets you **actually manage it** — here's what sets it apart:

| Feature | Why It Matters |
|---------|---------------|
| **Side-by-side playlist workspace** | No other free tool lets you open two playlists and drag songs between them in real time. It feels like a file manager for your music. |
| **Copy vs. Move mode** | Choose whether dragging a song copies it to the target playlist or moves it (removes from source). One toggle, zero confusion. |
| **Instant pagination** | Every "Load More" button silently prefetches the next 50 tracks the moment you hover over it. By the time you click, the data is already there — **zero waiting**. |
| **Language-aware genre sorting** | Automatically separates your Tamil, English, K-pop, Hindi, and Telugu songs. Perfect for multilingual listeners who want genre-specific playlists without manually sorting hundreds of songs. |
| **Collab-aware detection** | A Tamil × English collab track appears in **both** categories, so you never miss a song. |
| **Preview before extracting** | Before creating a new genre playlist, you can preview every song that will be included — no surprises. |
| **One-click artist dump** | Extract every unique artist from any playlist and copy the full list to your clipboard. Useful for concert research, Spotify Wrapped stats, or sharing with friends. |
| **In-app playlist creation** | Create brand-new Spotify playlists directly from the workspace selector dropdown — no need to switch to Spotify. |
| **Drag-to-reorder editor** | Reorder tracks in any playlist (even Liked Songs!) with a smooth drag-and-drop interface, then save the new order to Spotify. |
| **Liked Songs = first-class citizen** | Every feature (workspace, genre extract, artist extract, detail view, reorder) works with your Liked Songs, not just regular playlists. Spotify's own app doesn't let you do half of this with Liked Songs. |
| **No account needed, no data stored** | Your Spotify credentials are never stored on any server. Authentication is 100% client-side using the PKCE flow. Close the tab and nothing persists. |

---

## ⚡ What Makes It Special — Under the Hood (Technical)

### 1. Hover-to-Prefetch Architecture
Every paginated list implements a custom **hover-to-prefetch** strategy. When the user's cursor enters the "Load More" button, a background fetch fires silently via `onMouseEnter`. The prefetched tracks are cached in React state (`prefetchCache`, `prefetchedTracks`). On click, the cached data is used instantly — falling back to a live API call only if the cache is empty or the prefetch failed.

```
User hovers "Load More" → silent fetch (50 tracks) → stored in state
User clicks "Load More"  → uses cached data instantly → no spinner
```

This pattern is implemented independently across **four different pages** (Workspace, Playlist Detail, Artist Extractor, Edit page), each with its own `useRef` guard to prevent duplicate prefetches.

### 2. Fully Client-Side Auth (No Backend)
The entire app runs without a backend server. Authentication uses **Spotify's PKCE (Proof Key for Code Exchange)** flow via the official `@spotify/web-api-ts-sdk`. This means:
- No server-side secret is needed
- No API proxy or token relay server
- Token refresh is handled automatically by the SDK
- Session timeout errors are caught and gracefully redirect to `/login?timeout=1`

### 3. 400+ Artist Canonical Database for Genre Detection
Instead of relying on Spotify's often-inaccurate genre tags, the genre extractor uses a **hand-curated database of 400+ artists** mapped to their exact Spotify display names. The detection runs a **three-tier fallback**:

```
Tier 1: Exclusive artist override (guaranteed single-genre)
Tier 2: Canonical name match against 5 language lists (multi-match for collabs)
Tier 3: Unicode regex on track title (Tamil/Korean/Hindi/Telugu character ranges)
Tier 4: Default to English
```

The matching logic uses both exact comparison and prefix/suffix matching (`artist === canonical || artist.startsWith(canonical + " ")`) to handle Spotify's inconsistent display name formatting.

### 4. Multi-Genre Collaboration Handling
Unlike simple "first match wins" systems, the `detectLanguages()` function returns an **array of all matching genres**. A track like "Anirudh × The Weeknd" gets classified as both Tamil and English. The track is added to **every matching genre bucket** with deduplication (`Set`-based URI checking) to avoid double-counting.

### 5. Smart Drag-and-Drop with Real-Time Sync
The workspace uses `@dnd-kit/core` with a **PointerSensor** configured with an 8px activation distance — preventing accidental drags from clicks. On `DragEnd`:
1. The track is immediately added to the target playlist on Spotify (`playlists.addItemsToPlaylist` or `currentUser.tracks.saveTracks`)
2. If in "Move" mode, the track is also removed from the source playlist
3. Local Zustand state is updated optimistically for instant UI feedback
4. Toast notifications confirm every Spotify sync operation

### 6. Zustand with DevTools for State Management
Playlist state (selected playlists A & B, available playlists, drag mode, track operations) is managed through a single Zustand store with `devtools` middleware enabled. This gives full time-travel debugging in Redux DevTools while keeping the code lean — the entire store is ~130 lines with zero boilerplate.

### 7. Liked Songs Reorder Workaround
Spotify's API doesn't support reordering Liked Songs. The edit page works around this by:
1. Removing all loaded liked tracks (`currentUser.tracks.removeSavedTracks`)
2. Re-adding them in **reverse order** (since Liked Songs are displayed newest-first)
3. Batching in groups of 50 to stay within API rate limits

This is a creative hack that effectively achieves reorder functionality where Spotify itself doesn't provide it.

### 8. Batch API Operations
Genre extraction processes playlists of any size by paginating through all tracks (50 at a time) and then adding extracted tracks to the target playlist in **batches of 100** (the Spotify API maximum). This handles playlists with thousands of tracks without hitting rate limits.

### 9. Smart Playlist Selector with Locking
The workspace's `PlaylistSelector` component includes:
- **Search filtering** with case-insensitive matching
- **Lock indicator** — if a playlist is already selected on the other side, it shows a lock icon and is disabled (prevents selecting the same playlist twice)
- **Inline playlist creation** — creates the playlist on Spotify and auto-selects it
- **Alphabetical sorting** with Liked Songs pinned to the top

### 10. Zero-Dependency Design Tokens
The Tailwind config defines a complete custom color system (`spotify-green`, `background-primary/secondary/tertiary`, `text-primary/secondary/tertiary`, accent colors) — no external UI library like shadcn or Chakra. Every component is hand-built with consistent tokens, resulting in a **lightweight, fast-loading app** with no dependency bloat.

---

## ✨ Features

### 🏠 Dashboard
- At-a-glance stats: total playlists, total tracks, liked songs count
- Full playlist library grid with album art thumbnails
- Hover-to-reveal play overlay on each playlist card
- Direct access to Liked Songs and individual playlist detail views
- Quick-link to open the Workspace

### 🎯 Playlist Workspace (Drag & Drop)
- **Dual-pane layout** — select any two playlists (including Liked Songs) side by side
- **Drag and drop** tracks between playlists using `@dnd-kit` with pointer sensor activation
- **Copy or Move mode** — toggle between copying a track to the target playlist or moving it (removes from source)
- **Real-time Spotify sync** — every drag action immediately calls the Spotify API to add/remove tracks
- **Create new playlists** directly from the workspace selector modal
- **Searchable playlist picker** with alphabetical sorting and lock indicator for the already-selected playlist
- **Hover-to-prefetch** — the next batch of 50 tracks is silently fetched when you hover over "Load More," making pagination feel instant

### 🎶 Genre Extraction Tool
- Select any playlist (or Liked Songs) and automatically classify every track by language/genre
- **Supported languages:** Tamil, English, K-pop (Korean), Hindi, Telugu
- Detection uses a **curated artist database of 400+ artists** matched to their exact Spotify display names, covering:
  - Music directors, playback singers, indie artists, rappers, lyricists, and actor-singers
- **Unicode script fallback** — if the artist isn't in the database, the track name is checked against Tamil (U+0B80–U+0BFF), Korean (U+AC00–U+D7AF), Hindi (U+0900–U+097F), and Telugu (U+0C00–U+0C7F) character ranges
- **Multi-genre detection** — collaboration tracks with artists from different languages appear in all matching categories
- **Preview songs** per genre in a modal before extracting
- **Extract to a new playlist** (auto-named, e.g. "Tamil + K-pop Mix") or **add to an existing playlist**
- Batch addition in groups of 100 via the Spotify API

### 👤 Artist Extractor
- Select any playlist and extract every unique artist name
- Paginated loading in batches of 50 tracks with hover-to-prefetch
- **Copy all artist names** to clipboard with one click (comma-separated, alphabetically sorted)
- Live progress display: `X unique artists from Y/Z tracks`

### 📋 Playlist Detail View
- Spotify-style full track listing with album art, artist names, album name, date added, and duration
- Responsive 5-column grid layout
- Total playlist duration calculation (hours & minutes)
- Direct link to the **Edit Order** page for each playlist
- Hover-to-prefetch pagination

### ✏️ Playlist Editor (Reorder Tracks)
- **Drag-and-drop reorder** any playlist's track order using `@dnd-kit` sortable list
- Visual grip handle, track numbering, and drag highlight animation
- **Unsaved changes indicator** — warns before losing reorder changes
- **Save to Spotify** — uses `playlists.updatePlaylistItems` for regular playlists, or a remove-and-readd strategy for Liked Songs
- Hover-to-prefetch for loading additional tracks

### ⚙️ Settings
- View your Spotify profile (avatar, display name, email, country, follower count)
- See subscription tier (Free / Premium)
- Review granted app permissions (read playlists, modify playlists, access liked songs, view profile)
- Link to manage connected apps on Spotify
- Log out (clears all local/session storage)

### 🔐 Authentication
- **Spotify OAuth 2.0 with PKCE** — fully client-side, no backend secret required
- Powered by the official `@spotify/web-api-ts-sdk`
- Automatic token refresh handling with session timeout detection
- Graceful redirect to login on expired sessions
- Scopes: `user-read-private`, `user-read-email`, `user-library-read`, `user-library-modify`, `playlist-read-private`, `playlist-read-collaborative`, `playlist-modify-public`, `playlist-modify-private`

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | TypeScript |
| **UI** | React 19, [Lucide Icons](https://lucide.dev/) |
| **Styling** | [Tailwind CSS 3](https://tailwindcss.com/), custom dark theme with Spotify-inspired palette |
| **State Management** | [Zustand 5](https://zustand.docs.pmnd.rs/) with devtools middleware |
| **Drag & Drop** | [@dnd-kit](https://dndkit.com/) (core + sortable) |
| **Charts** | [Recharts 3](https://recharts.org/) |
| **Spotify API** | [@spotify/web-api-ts-sdk](https://github.com/spotify/spotify-web-api-ts-sdk) |
| **Notifications** | [react-hot-toast](https://react-hot-toast.com/) |
| **Font** | [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) |

---

## 📁 Project Structure

```
spotsync-crm/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page (marketing / hero)
│   ├── layout.tsx              # Root layout with Toaster & metadata
│   ├── globals.css             # Global styles, scrollbar, animations
│   ├── login/page.tsx          # Spotify login screen
│   ├── callback/page.tsx       # OAuth callback handler
│   ├── dashboard/page.tsx      # Dashboard with stats & library grid
│   ├── workspace/page.tsx      # Dual-pane drag & drop workspace
│   ├── extract/page.tsx        # Genre extraction tool
│   ├── artists/page.tsx        # Artist name extractor
│   ├── playlist/[id]/page.tsx  # Playlist detail view
│   ├── edit/[id]/page.tsx      # Drag-to-reorder editor
│   └── settings/page.tsx       # Profile, permissions & logout
│
├── components/
│   ├── layout/                 # App shell components
│   │   ├── Sidebar.tsx         # Fixed sidebar with navigation links
│   │   ├── Header.tsx          # Top bar with user avatar & logout
│   │   └── MainLayout.tsx      # Combines Sidebar + Header + content area
│   │
│   ├── ui/                     # Reusable UI primitives
│   │   ├── Button.tsx          # Button with variants (primary, secondary, ghost, danger)
│   │   ├── Card.tsx            # Card & CardContent with interactive variant
│   │   ├── Badge.tsx           # Colored badge component
│   │   ├── Modal.tsx           # Overlay modal with backdrop blur
│   │   └── MagicDropdown.tsx   # Searchable dropdown with icons & subtitles
│   │
│   └── workspace/              # Workspace-specific components
│       ├── PlaylistSelector.tsx # Dropdown with search, create-new, & lock indicator
│       ├── PlaylistContainer.tsx# Scrollable track list with droppable zone
│       ├── SongCard.tsx        # Draggable individual track card
│       └── DragModeToggle.tsx  # Copy / Move mode toggle button
│
├── lib/
│   └── spotify/
│       └── auth.ts             # Spotify SDK init, auth helpers, session timeout
│
├── store/
│   └── playlistStore.ts        # Zustand store (playlists, tracks, drag mode)
│
├── .env.example                # Required environment variables template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A **Spotify Developer account** — [Create one here](https://developer.spotify.com/dashboard)

### 1. Clone the Repository

```bash
git clone https://github.com/peterish8/SpotSync-CRM.git
cd SpotSync-CRM
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (use `.env.example` as reference):

```env
# Get these from https://developer.spotify.com/dashboard
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/
```

#### Spotify Dashboard Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **Create App**
3. Set **Redirect URI** to `http://localhost:3000/` (must match `.env.local` exactly)
4. Copy the **Client ID** into your `.env.local`
5. No Client Secret is needed — the app uses the PKCE flow

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page. Click **Connect with Spotify** to authenticate and access the dashboard.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 🎨 Design System

The app uses a fully custom dark theme inspired by Spotify's design language:

| Token | Purpose | Value |
|-------|---------|-------|
| `spotify-green` | Primary accent | `#1DB954` |
| `background-primary` | Page background | `#0a0a0a` |
| `background-secondary` | Cards & sidebar | `#121212` |
| `background-tertiary` | Inputs & nested panels | `#1a1a1a` |
| `text-primary` | Main text | `#ffffff` |
| `text-secondary` | Muted text | `#a1a1a1` |
| `accent-purple` | K-pop / secondary accent | `#8B5CF6` |
| `accent-blue` | English / info accent | `#3B82F6` |
| `accent-orange` | Tamil / warning accent | `#F97316` |
| `accent-red` | Danger / errors | `#EF4444` |

Custom features include:
- **Spotify-green selection highlight** on text selection
- **Animated pulse border** on active drag elements
- **Custom scrollbar** styling across all scrollable areas
- **Inter font** loaded via Google Fonts

---

## 🎵 Genre Detection — How It Works

The genre extraction uses a **three-tier detection strategy**:

1. **Exclusive artist override** — Certain artists (e.g., Sai Abhyankkar) are hard-coded to always return a single genre regardless of collaborators.

2. **Canonical artist matching** — Each track's artist names are matched against curated lists:
   - **Tamil**: 110+ artists (A.R. Rahman, Anirudh Ravichander, Sid Sriram, etc.)
   - **English**: 220+ artists (Taylor Swift, Drake, Coldplay, etc.)
   - **K-pop**: 80+ artists (BTS, BLACKPINK, IU, etc.)
   - **Hindi**: 40+ artists (Arijit Singh, Pritam, Shreya Ghoshal, etc.)
   - **Telugu**: 30+ artists (Devi Sri Prasad, Thaman S, etc.)

3. **Unicode script fallback** — If no artist match is found, the track title is scanned for non-Latin script characters (Tamil, Korean, Devanagari, Telugu).

4. **Default** — If none of the above match, the track defaults to **English**.

Collaboration tracks are assigned to **every matching genre**, so a Tamil × English collab appears in both categories.

---

## 🔄 Prefetch Strategy

All paginated views implement a **hover-to-prefetch** pattern:

1. Tracks are loaded in batches of **50** (Spotify API limit)
2. When the user **hovers** over the "Load More" button, the next 50 tracks are **silently fetched** in the background
3. When the user **clicks**, the prefetched data is used instantly — no loading spinner
4. If the prefetch fails, the click falls back to a normal fetch

This applies to: Playlist Detail, Workspace, Artist Extractor, and Edit page.

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server (hot reload) |
| `npm run build` | Create an optimized production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint on the codebase |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private. See the repository settings for access details.

---

<p align="center">
  <strong>Powered by Spotify Web API • Built with Next.js</strong>
</p>
