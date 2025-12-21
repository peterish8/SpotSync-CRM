"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Layers, Settings, Filter, Users, LogOut } from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Workspace", href: "/workspace", icon: Layers },
  { name: "Genre Extract", href: "/extract", icon: Filter },
  { name: "Artist Extract", href: "/artists", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-background-secondary border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-3">
          <img 
            src="/favicon.ico" 
            alt="SyncSpot" 
            className="w-10 h-10 rounded-lg"
          />
          <div>
            <h1 className="font-bold text-text-primary">SyncSpot</h1>
            <p className="text-xs text-text-secondary">CRM</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-spotify-green/10 text-spotify-green"
                  : "text-text-secondary hover:text-text-primary hover:bg-background-hover"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-4">
        <button
          onClick={() => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = "/";
          }}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-text-secondary hover:text-accent-red hover:bg-background-hover transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
        <p className="text-xs text-text-tertiary text-center">
          Powered by Spotify API
        </p>
      </div>
    </aside>
  );
}
