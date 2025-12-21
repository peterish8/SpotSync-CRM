import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";

const SPOTIFY_SCOPES = [...Scopes.userDetails, ...Scopes.userLibrary, ...Scopes.playlistRead, ...Scopes.playlistModify];

// Singleton for login page
export const spotify = SpotifyApi.withUserAuthorization(
  process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
  process.env.NEXT_PUBLIC_REDIRECT_URI!,
  SPOTIFY_SCOPES
);

interface AuthResult {
  sdk: SpotifyApi;
  authenticated: boolean;
}

/**
 * Get authenticated Spotify SDK with smart session timeout handling
 * Returns { sdk, authenticated: true } on success
 * Returns { sdk: null, authenticated: false } and clears storage on failure
 */
export async function getAuthenticatedSdk(): Promise<AuthResult | null> {
  try {
    const sdk = SpotifyApi.withUserAuthorization(
      process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
      process.env.NEXT_PUBLIC_REDIRECT_URI!,
      SPOTIFY_SCOPES
    );

    const { authenticated } = await sdk.authenticate();
    
    if (!authenticated) {
      return null;
    }

    return { sdk, authenticated: true };
  } catch (error: any) {
    console.error("Auth error:", error);
    
    // Check for token refresh failures
    if (
      error.message?.includes("Failed to refresh token") ||
      error.message?.includes("Failed to remove token") ||
      error.message?.includes("server_error") ||
      error.message?.includes("No token")
    ) {
      // Clear all storage to force re-login
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
      }
      return null;
    }

    throw error;
  }
}

/**
 * Check if error is a session timeout error
 */
export function isSessionTimeoutError(error: any): boolean {
  const message = error?.message || "";
  return (
    message.includes("Failed to refresh token") ||
    message.includes("Failed to remove token") ||
    message.includes("server_error") ||
    message.includes("No token") ||
    message.includes("access_token")
  );
}

/**
 * Handle session timeout - clear storage and redirect
 */
export function handleSessionTimeout(router: any) {
  if (typeof window !== "undefined") {
    localStorage.clear();
    sessionStorage.clear();
  }
  router.push("/login?timeout=1");
}
