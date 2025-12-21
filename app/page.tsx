"use client";

import { Music, Layers, Filter, Users, Sparkles, ArrowRight, Check, Zap } from "lucide-react";
import { spotify } from "@/lib/spotify/auth";
import toast, { Toaster } from "react-hot-toast";

export default function LandingPage() {
  const handleLogin = async () => {
    console.log("Login button clicked");
    try {
      await spotify.authenticate();
    } catch (error: any) {
      console.error("Login failed:", error);
      toast.error(error.message || "Failed to connect to Spotify");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#0f1a0f] to-[#0a0a0a]">
      <Toaster position="top-center" />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-spotify-green rounded-xl flex items-center justify-center">
              <Music className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold text-white">SyncSpot</span>
          </div>
          <button
            onClick={handleLogin}
            className="relative z-50 px-6 py-2.5 bg-spotify-green hover:bg-spotify-green-hover text-black font-semibold rounded-full transition-all hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-spotify-green" />
            <span className="text-sm text-white/70">Professional Playlist Management</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Organize Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-spotify-green to-emerald-400">
              Spotify Playlists
            </span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Extract genres, drag & drop tracks, manage your music library like never before.
            Built for music lovers who want complete control.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={handleLogin}
              className="group relative z-50 px-8 py-4 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-full transition-all hover:scale-105 flex items-center gap-2"
            >
              Connect with Spotify
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#features"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-all border border-white/10"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 flex items-center justify-center gap-12 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">5+</p>
              <p className="text-sm text-white/50">Languages Detected</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-white/50">Free to Use</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">Instant</p>
              <p className="text-sm text-white/50">Sync with Spotify</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Powerful Features</h2>
            <p className="text-lg text-white/50">Everything you need to manage your music library</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-spotify-green/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-spotify-green/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-spotify-green/30 transition-colors">
                <Layers className="w-6 h-6 text-spotify-green" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Workspace</h3>
              <p className="text-sm text-white/50">
                Drag and drop tracks between playlists with real-time Spotify sync.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-accent-purple/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent-purple/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-purple/30 transition-colors">
                <Filter className="w-6 h-6 text-accent-purple" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Genre Extract</h3>
              <p className="text-sm text-white/50">
                Automatically detect Tamil, K-pop, Hindi, Telugu & English songs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-accent-blue/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent-blue/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-blue/30 transition-colors">
                <Users className="w-6 h-6 text-accent-blue" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Artist Extract</h3>
              <p className="text-sm text-white/50">
                Get all unique artist names from any playlist in one click.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-accent-orange/50 transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-accent-orange/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-accent-orange/30 transition-colors">
                <Zap className="w-6 h-6 text-accent-orange" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Instant Loading</h3>
              <p className="text-sm text-white/50">
                Hover-to-prefetch technology for lightning-fast pagination.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-lg text-white/50">Get started in seconds</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-spotify-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-spotify-green">1</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Connect</h3>
              <p className="text-sm text-white/50">Login with your Spotify account securely</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-spotify-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-spotify-green">2</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Select</h3>
              <p className="text-sm text-white/50">Choose a playlist to analyze or organize</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-spotify-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-spotify-green">3</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Manage</h3>
              <p className="text-sm text-white/50">Extract genres, move tracks, sync instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Languages */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Language Detection</h2>
          <p className="text-lg text-white/50 mb-12">Smart artist-based genre classification</p>

          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: "Tamil", color: "#F97316" },
              { name: "English", color: "#3B82F6" },
              { name: "K-pop", color: "#8B5CF6" },
              { name: "Hindi", color: "#EC4899" },
              { name: "Telugu", color: "#14B8A6" },
            ].map((lang) => (
              <div
                key={lang.name}
                className="px-6 py-3 rounded-full border transition-all hover:scale-105"
                style={{ borderColor: lang.color, backgroundColor: `${lang.color}20` }}
              >
                <span className="font-semibold" style={{ color: lang.color }}>{lang.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gradient-to-r from-spotify-green/20 to-emerald-500/20 rounded-3xl p-12 border border-spotify-green/30">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-white/60 mb-8">
            Connect your Spotify account and take control of your music library.
          </p>
          <button
            onClick={handleLogin}
            className="inline-flex items-center gap-2 px-8 py-4 bg-spotify-green hover:bg-spotify-green-hover text-black font-bold rounded-full transition-all hover:scale-105"
          >
            <Music className="w-5 h-5" />
            Connect with Spotify
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-spotify-green rounded-lg flex items-center justify-center">
              <Music className="w-4 h-4 text-black" />
            </div>
            <span className="text-sm text-white/50">SyncSpot CRM</span>
          </div>
          <p className="text-sm text-white/30">
            Powered by Spotify Web API • Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
