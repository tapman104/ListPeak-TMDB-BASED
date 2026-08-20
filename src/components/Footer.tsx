import React from 'react';
import { KeyRound, Heart, ExternalLink } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export const Footer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <footer className="w-full bg-[#05050a] border-t border-[var(--color-border-subtle)] text-[var(--color-text-muted)] font-sans mt-12 sm:mt-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-12 py-10 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 mb-10 sm:mb-12">
          {/* Col 1: Brand */}
          <div className="flex flex-col gap-3 items-start">
            <div 
              className="flex items-center gap-2.5 cursor-pointer text-left"
              onClick={() => navigate({ to: '/' })}
            >
              <KeyRound className="text-[var(--color-accent)]" size={20} />
              <span className="font-display font-bold text-[var(--color-text-primary)] text-2xl tracking-[0.06em]">
                ListPeak
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed max-w-xs">
              A private, client-side TMDB client for exploring trending cinema, popular shows, and filmography.
            </p>
          </div>

          {/* Col 2: Navigation */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
              Explore
            </h4>
            <button 
              onClick={() => navigate({ to: '/' })} 
              className="text-left text-xs sm:text-sm hover:text-[var(--color-text-primary)] transition-colors py-1 min-h-[36px] flex items-center cursor-pointer"
            >
              Trending This Week
            </button>
            <button 
              onClick={() => navigate({ to: '/' })} 
              className="text-left text-xs sm:text-sm hover:text-[var(--color-text-primary)] transition-colors py-1 min-h-[36px] flex items-center cursor-pointer"
            >
              Popular Movies
            </button>
            <button 
              onClick={() => navigate({ to: '/' })} 
              className="text-left text-xs sm:text-sm hover:text-[var(--color-text-primary)] transition-colors py-1 min-h-[36px] flex items-center cursor-pointer"
            >
              Top Rated TV Series
            </button>
          </div>

          {/* Col 3: Resources */}
          <div className="flex flex-col gap-2.5">
            <h4 className="font-sans font-semibold text-xs sm:text-sm uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
              Resources
            </h4>
            <a 
              href="https://www.themoviedb.org/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs sm:text-sm hover:text-[var(--color-text-primary)] transition-colors py-1 min-h-[36px] flex items-center gap-1.5"
            >
              TMDb Official Site <ExternalLink size={12} />
            </a>
            <a 
              href="https://developer.themoviedb.org/docs" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs sm:text-sm hover:text-[var(--color-text-primary)] transition-colors py-1 min-h-[36px] flex items-center gap-1.5"
            >
              TMDb API Docs <ExternalLink size={12} />
            </a>
            <button 
              onClick={() => navigate({ to: '/setup' })}
              className="text-left text-xs sm:text-sm hover:text-[var(--color-text-primary)] transition-colors py-1 min-h-[36px] flex items-center cursor-pointer"
            >
              API Key Settings
            </button>
          </div>

          {/* Col 4: Privacy & Attribution */}
          <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
            <h4 className="font-sans font-semibold uppercase tracking-wider text-[var(--color-text-primary)] mb-1">
              Privacy First
            </h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Your TMDb API key is stored strictly in your browser's local storage. No data or keys are transmitted to any middle tier servers.
            </p>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 sm:pt-8 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] sm:text-xs">
          <p>
            © {new Date().getFullYear()} ListPeak. Powered by TMDb API. This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <div className="flex items-center gap-1 text-[var(--color-text-muted)]">
            Built with <Heart size={12} className="text-[var(--color-accent)] fill-[var(--color-accent)]" /> for cinema lovers
          </div>
        </div>
      </div>
    </footer>
  );
};
