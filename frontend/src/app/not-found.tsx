import Link from 'next/link';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 relative z-10">
      {/* Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      
      <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 font-rajdhani mb-2">
        404
      </h1>
      
      <h2 className="text-2xl md:text-3xl font-black text-white font-rajdhani mb-4">
        PAGE NOT FOUND
      </h2>
      
      <p className="text-zinc-400 font-noto max-w-md mx-auto mb-8">
        Oops! It looks like this page is still being drawn by our mangakas, or it has been lost in another dimension.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold transition-transform hover:scale-105 shadow-[0_0_20px_rgba(255,46,46,0.4)]"
        >
          <Home size={18} />
          Back to Home
        </Link>
        
        <Link 
          href="/discover" 
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold transition-colors hover:bg-white/10"
        >
          <Compass size={18} />
          Explore Manga
        </Link>
      </div>
    </div>
  );
}
