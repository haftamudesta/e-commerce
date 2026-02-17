import { StateCreator } from 'zustand';

export interface UISlice {
  isDarkMode: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
  
  toggleDarkMode: () => void;
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set) => ({
  isDarkMode: false,
  isMobileMenuOpen: false,
  searchQuery: '',
  
  toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),
  
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),
});