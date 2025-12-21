"use client";

import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";

// Define the scopes we need
const scopes = [
  ...Scopes.userDetails,
  ...Scopes.userLibrary,
  ...Scopes.playlistRead,
  ...Scopes.playlistModify,
];

// Initialize the SDK
// We use a singleton pattern to ensure we don't create multiple instances
export const spotify = SpotifyApi.withUserAuthorization(
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
  process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/callback",
  scopes
);
