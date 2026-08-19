import React, { useEffect, useState } from 'react';
import { KeyRound, Search, Bookmark, LogOut, Menu, X, Home, Film, Tv } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useKeyStore } from '../store/keyStore';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar: React.FC = () => {
  const clearApiKey = useKeyStore((state) => state.clearApiKey);
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClearKey = () => {
    clearApiKey();
    setMobileMenuOpen(false);
    navigate({ to: '/setup' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Keep clean search handler if needed
  };

  return (
    <>
      <nav 
        className="fixed top-0 left-0 right-0 w-full z-50 transition-all duration-300 px-4 sm:px-8 md:px-12"
        style={{
          background: isScrolled || mobileMenuOpen || searchOpen
            ? 'rgba(7, 7, 13, 0.95)' 
            : 'linear-gradient(180deg, rgba(7,7,13,0.92) 0%, rgba(7,7,13,0.4) 60%, rgba(7,7,13,0) 100%)',
          backdropFilter: isScrolled || mobileMenuOpen || searchOpen ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: isScrolled || mobileMenuOpen || searchOpen ? 'blur(12px)' : 'none',
          height: '64px',
        }}
      >
        <div className="flex items-center justify-between h-full max-w-[1600px] mx-auto">
          {/* Left: Logo & Desktop Links */}
          <div className="flex items-center gap-8">
            <button 
              className="flex items-center gap-2.5 cursor-pointer text-left py-2 min-h-[44px] min-w-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg"
              onClick={() => {
                setMobileMenuOpen(false);
                navigate({ to: '/' });
              }}
              aria-label="CineKey Home"
            >
              <KeyRound className="text-[var(--color-accent)] shrink-0" size={20} />
              <span className="font-display font-bold text-[var(--color-text-primary)] text-xl sm:text-2xl tracking-[0.06em] mt-0.5">
                CINEKEY
              </span>
            </button>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-sans font-medium text-[var(--color-text-muted)]">
              <button 
                onClick={() => navigate({ to: '/' })}
                className="hover:text-[var(--color-text-primary)] transition-colors py-2"
              >
                Home
              </button>
              <button 
                onClick={() => navigate({ to: '/' })}
                className="hover:text-[var(--color-text-primary)] transition-colors py-2"
              >
                Trending
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Search Bar */}
            <div className="hidden md:flex items-center relative">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, TV, actors..."
                  className="w-48 lg:w-64 bg-[var(--color-surface)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-xs rounded-full pl-9 pr-4 py-2 outline-none transition-all duration-200 focus:w-72"
                />
                <Search size={15} className="absolute left-3 text-[var(--color-text-muted)] pointer-events-none" />
              </form>
            </div>

            {/* Mobile Search Toggle */}
            <button 
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (mobileMenuOpen) setMobileMenuOpen(false);
              }}
              className="md:hidden flex items-center justify-center w-11 h-11 text-[var(--color-text-muted)] hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-full"
              aria-label="Toggle Search"
            >
              {searchOpen ? <X size={20} /> : <Search size={20} />}
            </button>

            {/* User Dropdown (Desktop & Tablet) */}
            <div className="hidden sm:block">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button 
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-[var(--color-accent-dim)] border-[1.5px] border-[var(--color-accent)] text-[var(--color-text-primary)] font-sans font-semibold text-xs hover:ring-2 hover:ring-[var(--color-accent)]/50 outline-none transition-all cursor-pointer"
                    aria-label="User Menu"
                  >
                    CK
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="min-w-[200px] bg-[var(--color-surface)] rounded-[10px] p-2 shadow-[0_8px_32px_rgba(0,0,0,0.6)] border border-[var(--color-border-subtle)] animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 z-50"
                    sideOffset={8}
                    align="end"
                  >
                    <DropdownMenu.Item 
                      onClick={() => navigate({ to: '/' })}
                      className="flex items-center gap-3 px-3 h-[38px] text-sm text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-accent-dim)] rounded-md font-sans transition-colors"
                    >
                      <Bookmark size={16} />
                      My List
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Separator className="h-px bg-[var(--color-border-subtle)] my-1" />
                    
                    <DropdownMenu.Item
                      onClick={handleClearKey}
                      className="flex items-center gap-3 px-3 h-[38px] text-sm text-[var(--color-text-primary)] outline-none cursor-pointer hover:bg-[var(--color-accent-dim)] rounded-md font-sans transition-colors"
                    >
                      <KeyRound size={16} />
                      Change API Key
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                      onClick={handleClearKey}
                      className="flex items-center gap-3 px-3 h-[38px] text-sm text-red-400 outline-none cursor-pointer hover:bg-red-400/10 rounded-md font-sans transition-colors"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                if (searchOpen) setSearchOpen(false);
              }}
              className="md:hidden flex items-center justify-center w-11 h-11 text-[var(--color-text-primary)] hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden pb-4"
            >
              <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search movies, shows, people..."
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] focus:border-[var(--color-accent)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] text-sm rounded-xl pl-10 pr-4 py-3 outline-none"
                />
                <Search size={18} className="absolute left-3.5 text-[var(--color-text-muted)] pointer-events-none" />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm"
            />

            {/* Slide-down / Full-width Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="fixed top-[64px] left-0 right-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] p-6 md:hidden shadow-2xl flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ to: '/' });
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-card)] active:bg-[var(--color-accent-dim)] transition-colors text-base font-sans font-medium text-left min-h-[48px]"
                >
                  <Home size={18} className="text-[var(--color-accent)]" />
                  Home
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ to: '/' });
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-card)] active:bg-[var(--color-accent-dim)] transition-colors text-base font-sans font-medium text-left min-h-[48px]"
                >
                  <Film size={18} className="text-[var(--color-accent)]" />
                  Trending Movies
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ to: '/' });
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-card)] active:bg-[var(--color-accent-dim)] transition-colors text-base font-sans font-medium text-left min-h-[48px]"
                >
                  <Tv size={18} className="text-[var(--color-accent)]" />
                  TV Series
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate({ to: '/' });
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-primary)] hover:bg-[var(--color-card)] active:bg-[var(--color-accent-dim)] transition-colors text-base font-sans font-medium text-left min-h-[48px]"
                >
                  <Bookmark size={18} className="text-[var(--color-accent)]" />
                  My List
                </button>
              </div>

              <div className="border-t border-[var(--color-border-subtle)] pt-4 flex flex-col gap-2">
                <button
                  onClick={handleClearKey}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-card)] transition-colors text-sm font-sans min-h-[44px]"
                >
                  <KeyRound size={16} />
                  Change TMDb API Key
                </button>

                <button
                  onClick={handleClearKey}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors text-sm font-sans min-h-[44px]"
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

