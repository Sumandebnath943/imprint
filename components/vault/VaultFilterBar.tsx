"use client";

import { useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import type { FilterType, SortType } from "@/lib/vault/types";

const FILTERS: FilterType[] = ["All", "Strong", "Healthy", "Weakening", "Critical"];
const SORTS: { value: SortType; label: string }[] = [
  { value: "strength-asc",    label: "Strength: Low to High" },
  { value: "strength-desc",   label: "Strength: High to Low" },
  { value: "last-practiced",  label: "Last Practiced" },
  { value: "recently-added",  label: "Recently Added" },
  { value: "alphabetical",    label: "Alphabetical" },
];

interface VaultFilterBarProps {
  filter: FilterType;
  sort: SortType;
  search: string;
  onFilter: (f: FilterType) => void;
  onSort: (s: SortType) => void;
  onSearch: (s: string) => void;
}

export default function VaultFilterBar({ filter, sort, search, onFilter, onSort, onSearch }: VaultFilterBarProps) {
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const sel = filter === f;
          return (
            <button key={f} onClick={() => onFilter(f)}
              className="rounded-full text-xs font-medium transition-all duration-150"
              style={{
                padding: "6px 14px",
                background: sel ? "rgba(255,85,0,0.12)" : "#1A1A1A",
                border: sel ? "1px solid rgba(255,85,0,0.30)" : "1px solid rgba(255,255,255,0.08)",
                color: sel ? "#FF5500" : "rgba(255,255,255,0.70)",
              }}>
              {f}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex-1 relative" style={{ minWidth: 180, maxWidth: 280 }}>
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.30)" }} />
        <input
          value={search} onChange={(e) => onSearch(e.target.value)}
          placeholder="Search skills..."
          className="w-full outline-none text-sm"
          style={{
            background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 100, height: 36, padding: "0 16px 0 34px",
            color: "white",
          }}
        />
      </div>

      {/* Sort */}
      <div className="relative flex items-center gap-2 rounded-lg px-3 h-9"
        style={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.08)", minWidth: 180 }}>
        <ArrowUpDown size={14} style={{ color: "rgba(255,255,255,0.40)", flexShrink: 0 }} />
        <select value={sort} onChange={(e) => onSort(e.target.value as SortType)}
          className="flex-1 outline-none text-sm bg-transparent appearance-none cursor-pointer"
          style={{ color: "rgba(255,255,255,0.70)" }}>
          {SORTS.map((s) => <option key={s.value} value={s.value} style={{ background: "#1A1A1A" }}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}
