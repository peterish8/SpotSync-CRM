"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Music, Check, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
  subtitle?: string;
  icon?: React.ReactNode;
}

interface MagicDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MagicDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  icon,
  className = "",
}: MagicDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opt.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className={`relative group ${className}`}>
      {/* Glow Effect */}
      <div 
        className={`absolute -inset-0.5 bg-gradient-to-r from-spotify-green to-emerald-500 rounded-2xl blur opacity-20 transition duration-500 group-hover:opacity-40 
        ${isOpen ? "opacity-50" : ""}`} 
      />

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full flex items-center justify-between px-5 py-4 bg-[#121212] border border-white/10 rounded-2xl text-left shadow-xl transition-all duration-300 hover:bg-[#181818]"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {icon && <div className="text-spotify-green">{icon}</div>}
          <div className="flex flex-col truncate">
            {selectedOption ? (
              <>
                <span className="font-semibold text-white truncate">{selectedOption.label}</span>
                {selectedOption.subtitle && (
                  <span className="text-xs text-white/50 truncate text-left">{selectedOption.subtitle}</span>
                )}
              </>
            ) : (
              <span className="text-white/50">{placeholder}</span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-spotify-green transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 z-50">
          <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] overflow-hidden ring-1 ring-white/5">
            {/* Search Input */}
            {options.length > 5 && (
              <div className="p-3 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-2 pl-9 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-spotify-green/50"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all duration-200 group/item
                    ${
                      value === option.value
                        ? "bg-spotify-green/20 text-spotify-green"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {option.icon ? (
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover/item:text-white">
                          {option.icon}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover/item:text-white">
                          <Music className="w-4 h-4" />
                        </div>
                      )}
                      <div className="flex flex-col truncate">
                        <span className="font-medium truncate">{option.label}</span>
                        {option.subtitle && (
                          <span className={`${value === option.value ? "text-spotify-green/70" : "text-white/40 group-hover/item:text-white/60"} text-xs truncate`}>
                            {option.subtitle}
                          </span>
                        )}
                      </div>
                    </div>
                    {value === option.value && <Check className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-white/30 text-sm">No results found</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
