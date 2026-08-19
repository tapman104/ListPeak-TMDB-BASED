import React, { useEffect, useState } from 'react';
import { KeyRound, Search, Bookmark, LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useKeyStore } from '../store/keyStore';
import { useNavigate } from '@tanstack/react-router';

export const Navbar: React.FC = () => {
  const clearApiKey = useKeyStore((state) => state.clearApiKey);
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClearKey = () => {
    clearApiKey();
    navigate({ to: '/setup' });
  };

  return (
    <nav 
      className="fixed top-0 w-full z-50 transition-colors duration-300"
      style={{
        background: isScrolled 
          ? 'rgba(7, 7, 13, 0.97)' 
          : 'linear-gradient(180deg, rgba(7,7,13,0.98) 0%, rgba(7,7,13,0) 100%)',
        height: '64px',
        padding: '0 48px'
      }}
    >
      <div className="flex items-center justify-between h-full">
        {/* Left: Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate({ to: '/' })}
        >
          <KeyRound className="text-[var(--color-accent)]" size={18} />
          <span className="font-sans font-bold text-[var(--color-text-primary)] text-lg tracking-[0.08em] mt-0.5">
            CINEKEY
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button className="flex items-center justify-center w-10 h-10 text-[var(--color-text-muted)] hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full">
            <Search size={20} />
          </button>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-accent-dim)] border-[1.5px] border-[var(--color-accent)] text-[var(--color-text-primary)] font-sans font-semibold text-[11px] hover:ring-2 hover:ring-accent/50 outline-none transition-all">
                CK
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="min-w-[200px] bg-[var(--color-surface)] rounded-[10px] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-[var(--color-border-subtle)] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50"
                sideOffset={8}
                align="end"
              >
                <DropdownMenu.Item className="flex items-center gap-3 px-3 h-[36px] text-sm text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-accent-dim)] rounded-md font-sans transition-colors">
                  <Bookmark size={16} />
                  My List
                </DropdownMenu.Item>
                
                <DropdownMenu.Separator className="h-px bg-[var(--color-border-subtle)] my-1" />
                
                <DropdownMenu.Item
                  onClick={handleClearKey}
                  className="flex items-center gap-3 px-3 h-[36px] text-sm text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-accent-dim)] rounded-md font-sans transition-colors"
                >
                  <KeyRound size={16} />
                  Change API Key
                </DropdownMenu.Item>

                <DropdownMenu.Item
                  onClick={handleClearKey}
                  className="flex items-center gap-3 px-3 h-[36px] text-sm text-red-400 outline-none cursor-pointer hover:bg-red-400/10 rounded-md font-sans transition-colors"
                >
                  <LogOut size={16} />
                  Sign Out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </nav>
  );
};
