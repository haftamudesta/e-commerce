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
  favoriteProduct: FavoriteProduct[];
  
  addToFavorite: (product: FavoriteProduct) => void;
  removeFromFavorite: (productId: number) => void;
  isFavorite: (productId: number) => boolean;
  clearFavorites: () => void;
  getFavoriteCount: () => number;
}

export const createFavoriteSlice: StateCreator<FavoriteSlice> = (set, get) => ({
  favoriteProduct: [],
  
  addToFavorite: (product) => {
    const { favoriteProduct } = get();
    const exists = favoriteProduct.some(item => item.id === product.id);
    
    if (!exists) {
      set({ favoriteProduct: [...favoriteProduct, product] });
    }
  },
  
  removeFromFavorite: (productId) => {
    const { favoriteProduct } = get();
    set({
      favoriteProduct: favoriteProduct.filter(item => item.id !== productId)
    });
  },
  
  isFavorite: (productId) => {
    const { favoriteProduct } = get();
    return favoriteProduct.some(item => item.id === productId);
  },
  
  clearFavorites: () => set({ favoriteProduct: [] }),
  
  getFavoriteCount: () => {
    const { favoriteProduct } = get();
    return favoriteProduct.length;
  },
});