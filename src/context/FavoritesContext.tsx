import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { favoritesApi } from '../lib/api';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (petId: string) => void;
  isFavorite: (petId: string) => boolean;
  syncFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Load from localStorage as initial/offline state
    const saved = localStorage.getItem('pet_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync from server when authenticated
  const syncFavorites = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await favoritesApi.list();
      if (res.success) {
        const ids: string[] = res.data.pet_ids || [];
        setFavorites(ids);
        localStorage.setItem('pet_favorites', JSON.stringify(ids));
      }
    } catch {
      // fallback to localStorage already loaded
    }
  }, [isAuthenticated]);

  useEffect(() => {
    syncFavorites();
  }, [syncFavorites]);

  // Persist locally whenever favorites change
  useEffect(() => {
    localStorage.setItem('pet_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = async (petId: string) => {
    const isCurrentlyFav = favorites.includes(petId);
    // Optimistic update
    setFavorites(prev =>
      isCurrentlyFav ? prev.filter(id => id !== petId) : [...prev, petId]
    );

    if (isAuthenticated) {
      try {
        if (isCurrentlyFav) {
          await favoritesApi.remove(petId);
        } else {
          await favoritesApi.add(petId);
        }
      } catch {
        // Rollback on failure
        setFavorites(prev =>
          isCurrentlyFav ? [...prev, petId] : prev.filter(id => id !== petId)
        );
      }
    }
  };

  const isFavorite = (petId: string) => favorites.includes(petId);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite, syncFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
}
