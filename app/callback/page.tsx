"use client";

import { useEffect, useState } from "react";
import { SpotifyApi, Scopes } from "@spotify/web-api-ts-sdk";
import { useRouter } from "next/navigation";

export default function CallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const error = params.get("error");

        if (error) {
          setErrorMsg(`Spotify error: ${error}`);
          return;
        }

        if (!code) {
          setErrorMsg("No authorization code found.");
          return;
        }

        console.log("Authorization code received, exchanging for token...");
        setStatus("Exchanging code for access token...");

        // Create a fresh SDK instance to handle the callback
        const scopes = [
          ...Scopes.userDetails,
          ...Scopes.userLibrary,
          ...Scopes.playlistRead,
          ...Scopes.playlistModify,
        ];

        const sdk = SpotifyApi.withUserAuthorization(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!,
          process.env.NEXT_PUBLIC_REDIRECT_URI!,
          scopes
        );

        // The SDK should detect the code in the URL and exchange it
        // We need to call authenticate() which handles the full flow
        const { authenticated } = await sdk.authenticate();

        if (authenticated) {
          console.log("Authentication successful!");
          setStatus("Success! Redirecting to dashboard...");
          
          // Small delay to show success message
          setTimeout(() => {
            // Clear the URL parameters before redirecting
            window.history.replaceState({}, document.title, "/callback");
            router.push("/");
          }, 500);
        } else {
          setErrorMsg("Authentication failed. Please try again.");
        }
      } catch (error: any) {
        console.error("Callback error:", error);
        setErrorMsg(error?.message || "Failed to complete authentication.");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-background-primary flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md bg-background-secondary p-8 rounded-xl border border-border">
        {!errorMsg ? (
          <>
            <h2 className="text-xl font-bold text-text-primary">{status}</h2>
            <div className="w-8 h-8 border-4 border-spotify-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-accent-red">Error</h2>
            <p className="text-text-secondary">{errorMsg}</p>
            <button
              onClick={() => router.push("/login")}
              className="px-6 py-3 bg-spotify-green text-black rounded-full font-bold hover:bg-spotify-green-hover transition-colors"
            >
              Return to Login
            </button>
            <div className="text-xs text-text-tertiary break-all mt-4 p-2 bg-background-tertiary rounded">
              <strong>Debug:</strong> {typeof window !== "undefined" ? window.location.href : ""}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
