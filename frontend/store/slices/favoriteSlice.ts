import { StateCreator } from 'zustand';

export interface FavoriteProduct {
  id: number;
  name: string;
  price: number;
  image?: string;
  slug?: string;
  category_name?: string;
}

export interface FavoriteSlice {
  // State
  favoriteProduct: FavoriteProduct[];
  
  // Actions
  addToFavorite: (product: FavoriteProduct) => void;
  removeFromFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  clearFavorites: () => void;
  getFavoriteCount: () => number;
}

export const createFavoriteSlice: StateCreator<FavoriteSlice> = (set, get) => ({
  // Initial state
  favoriteProduct: [],
  
  // Add to favorites
  addToFavorite: (product) => {
    const { favoriteProduct } = get();
    const exists = favoriteProduct.some(item => item.id === product.id);
    
    if (!exists) {
      set({ favoriteProduct: [...favoriteProduct, product] });
    }
  },
  
  // Remove from favorites
  removeFromFavorite: (productId) => {
    const { favoriteProduct } = get();
    set({
      favoriteProduct: favoriteProduct.filter(item => item.id !== productId)
    });
  },
  
  // Check if product is favorite
  isFavorite: (productId) => {
    const { favoriteProduct } = get();
    return favoriteProduct.some(item => item.id === productId);
  },
  
  // Clear all favorites
  clearFavorites: () => set({ favoriteProduct: [] }),
  
  // Get favorite count
  getFavoriteCount: () => {
    const { favoriteProduct } = get();
    return favoriteProduct.length;
  },
});