import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { StoreState } from './types';
import { createCartSlice } from './slices/cartSlice';
import { createFavoriteSlice } from './slices/favoriteSlice';
import { createUISlice } from './slices/uiSlice';

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
          theme: state.theme,
          isDarkMode: state.isDarkMode,
        }),
      }
    ),
    { name: 'EcommerceStore' }
  )
);

export default useStore;


// UI Selectors
export const useIsDarkMode = () => useStore((state) => state.isDarkMode);
export const useTheme = () => useStore((state) => state.theme);
export const useMobileMenuOpen = () => useStore((state) => state.isMobileMenuOpen);
export const useSearchQuery = () => useStore((state) => state.searchQuery);

// UI Action Selectors
export const useToggleDarkMode = () => useStore((state) => state.toggleDarkMode);
export const useSetTheme = () => useStore((state) => state.setTheme);
export const useToggleMobileMenu = () => useStore((state) => state.toggleMobileMenu);
export const useOpenMobileMenu = () => useStore((state) => state.openMobileMenu);
export const useCloseMobileMenu = () => useStore((state) => state.closeMobileMenu);
export const useSetSearchQuery = () => useStore((state) => state.setSearchQuery);
export const useClearSearchQuery = () => useStore((state) => state.clearSearchQuery);

// Cart Selectors
export const useCartCount = () => useStore((state) => state.getCartCount());
export const useCartTotal = () => useStore((state) => state.getCartTotal());
export const useCartItems = () => useStore((state) => state.cart);
export const useCartOpen = () => useStore((state) => state.isCartOpen);

// Cart Action Selectors
export const useAddToCart = () => useStore((state) => state.addToCart);
export const useRemoveFromCart = () => useStore((state) => state.removeFromCart);
export const useUpdateCartQuantity = () => useStore((state) => state.updateCartQuantity);
export const useClearCart = () => useStore((state) => state.clearCart);
export const useToggleCart = () => useStore((state) => state.toggleCart);
export const useOpenCart = () => useStore((state) => state.openCart);
export const useCloseCart = () => useStore((state) => state.closeCart);

// Favorite Selectors
export const useFavoritesCount = () => useStore((state) => state.getFavoriteCount());
export const useFavoritesItems = () => useStore((state) => state.favoriteProduct);
export const useIsFavorite = (productId: number) => 
  useStore((state) => state.isFavorite(productId));

// Favorite Action Selectors
export const useAddToFavorite = () => useStore((state) => state.addToFavorite);
export const useRemoveFromFavorite = () => useStore((state) => state.removeFromFavorite);
export const useClearFavorites = () => useStore((state) => state.clearFavorites);