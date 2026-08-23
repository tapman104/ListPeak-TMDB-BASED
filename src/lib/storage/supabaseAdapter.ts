import type { StorageAdapter, ExportPayload } from './adapter';
import type { WatchlistEntry } from '../../store/watchlistStore';
import { supabase } from '../supabase';
import { localAdapter } from './localAdapter';
import { useAuthStore } from '../../store/authStore';

export const supabaseAdapter: StorageAdapter = {
  async getWatchlist() {
    const user = useAuthStore.getState().user;
    if (!user) return localAdapter.getWatchlist();

    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;

    // Convert from snake_case to camelCase
    const entries: WatchlistEntry[] = (data || []).map(row => ({
      id: row.media_id,
      type: row.media_type as 'movie' | 'tv',
      status: row.status as WatchlistEntry['status'],
      rating: row.rating,
      progress: row.progress,
      addedAt: row.added_at,
      updatedAt: row.updated_at,
      title: row.title,
      posterPath: row.poster_path,
      year: row.year,
    }));

    return entries;
  },

  async saveWatchlistEntry(entry: WatchlistEntry) {
    // Write-through to local storage immediately
    await localAdapter.saveWatchlistEntry(entry);

    const user = useAuthStore.getState().user;
    if (!user) return; // Background sync will pick it up later if they login

    const { error } = await supabase
      .from('watchlist')
      .upsert({
        user_id: user.id,
        media_id: entry.id,
        media_type: entry.type,
        status: entry.status,
        rating: entry.rating,
        progress: entry.progress,
        added_at: entry.addedAt,
        updated_at: entry.updatedAt,
        title: entry.title,
        poster_path: entry.posterPath,
        year: entry.year
      }, {
        onConflict: 'user_id, media_id, media_type'
      });

    if (error) throw error;
  },

  async removeWatchlistEntry(id: number, type: 'movie' | 'tv') {
    await localAdapter.removeWatchlistEntry(id, type);

    const user = useAuthStore.getState().user;
    if (!user) return;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .match({ user_id: user.id, media_id: id, media_type: type });

    if (error) throw error;
  },

  async getApiKey() {
    return localAdapter.getApiKey();
  },

  async saveApiKey(key: string) {
    // Spec: The TMDB API key is LOCAL ONLY. Do not sync to Supabase.
    await localAdapter.saveApiKey(key);
  },

  async exportAll(): Promise<ExportPayload> {
    return localAdapter.exportAll();
  },

  async importAll(payload: ExportPayload) {
    await localAdapter.importAll(payload);
    
    // After importing to local, if we are in cloud mode, we need to push all these to supabase.
    const user = useAuthStore.getState().user;
    if (user && payload.watchlist) {
      const rows = payload.watchlist.map(entry => ({
        user_id: user.id,
        media_id: entry.id,
        media_type: entry.type,
        status: entry.status,
        rating: entry.rating,
        progress: entry.progress,
        added_at: entry.addedAt,
        updated_at: entry.updatedAt,
        title: entry.title,
        poster_path: entry.posterPath,
        year: entry.year
      }));
      
      if (rows.length > 0) {
        const { error } = await supabase
          .from('watchlist')
          .upsert(rows, { onConflict: 'user_id, media_id, media_type' });
          
        if (error) console.error('Error importing to Supabase:', error);
      }
    }
  }
};
