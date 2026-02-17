import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { StoreState } from './types';
import { createCartSlice } from './slices/cartSlice';
import { createFavoriteSlice } from './slices/favoriteSlice';
import { createUISlice } from './slices/uiSlice';

// Combine all slices into one store
const useStore = create<StoreState>()(
  devtools(
    persist(
      (...args) => ({
        ...createCartSlice(...args),
        ...createFavoriteSlice(...args),
        ...createUISlice(...args),
      }),
      {
        name: 'ecommerce-storage',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          cart: state.cart,
          favoriteProduct: state.favoriteProduct,
        }),
      }
    ),
    { name: 'EcommerceStore' }
  )
);

export default useStore;

export const useCart = () => useStore((state) => ({
  cart: state.cart,
  isCartOpen: state.isCartOpen,
  addToCart: state.addToCart,
  removeFromCart: state.removeFromCart,
  updateCartQuantity: state.updateCartQuantity,
  clearCart: state.clearCart,
  getCartTotal: state.getCartTotal,
  getCartCount: state.getCartCount,
  toggleCart: state.toggleCart,
  openCart: state.openCart,
  closeCart: state.closeCart,
}));

export const useFavorites = () => useStore((state) => ({
  favoriteProduct: state.favoriteProduct,
  addToFavorite: state.addToFavorite,
  removeFromFavorite: state.removeFromFavorite,
  isFavorite: state.isFavorite,
  clearFavorites: state.clearFavorites,
  getFavoriteCount: state.getFavoriteCount,
}));

export const useUI = () => useStore((state) => ({
  isDarkMode: state.isDarkMode,
  isMobileMenuOpen: state.isMobileMenuOpen,
  searchQuery: state.searchQuery,
  toggleDarkMode: state.toggleDarkMode,
  toggleMobileMenu: state.toggleMobileMenu,
  openMobileMenu: state.openMobileMenu,
  closeMobileMenu: state.closeMobileMenu,
  setSearchQuery: state.setSearchQuery,
  clearSearchQuery: state.clearSearchQuery,
}));

export const useCartItems = () => useStore((state) => state.cart);
export const useCartOpen = () => useStore((state) => state.isCartOpen);
export const useFavoritesItems = () => useStore((state) => state.favoriteProduct);
export const useIsFavorite = (productId: number) => 
  useStore((state) => state.isFavorite(productId));

export const useCartCount = () => useStore((state) => state.getCartCount());
export const useCartTotal = () => useStore((state) => state.getCartTotal());

