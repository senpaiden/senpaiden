"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [text, setText] = useState(initialQuery);
  const [query] = useDebounce(text, 300);

  useEffect(() => {
    if (query) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    } else {
      router.push(`/search`);
    }
  }, [query, router]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search manga by title..."
        className="w-full h-14 pl-12 pr-4 bg-card/50 backdrop-blur-xl border border-white/10 rounded-full text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all shadow-lg"
      />
    </div>
  );
}
