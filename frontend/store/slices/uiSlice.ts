import { StateCreator } from 'zustand';

export interface UISlice {
  // State
  isDarkMode: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
  
  // Actions
  toggleDarkMode: () => void;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  // Initial state
  isDarkMode: false,
  isMobileMenuOpen: false,
  searchQuery: '',
  
  // Toggle dark mode
  toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),
  
  // Mobile menu actions
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  // Search actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),
});