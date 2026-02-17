import { StateCreator } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

export interface UISlice {
  isDarkMode: boolean;
  theme: Theme; 
  isMobileMenuOpen: boolean;
  searchQuery: string;
  
  toggleDarkMode: () => void;
  setTheme: (theme: Theme) => void; 
  toggleMobileMenu: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  setSearchQuery: (query: string) => void;
  clearSearchQuery: () => void;
}

export const createUISlice: StateCreator<UISlice> = (set, get) => ({
  isDarkMode: false,
  theme: 'system', 
  isMobileMenuOpen: false,
  searchQuery: '',
  
  toggleDarkMode: () => {
    const newIsDark = !get().isDarkMode;
    set({ 
      isDarkMode: newIsDark,
      theme: newIsDark ? 'dark' : 'light' 
    });
  },

  setTheme: (theme) => {
    set({ theme });
    
    if (theme === 'system') {
      if (typeof window !== 'undefined') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        set({ isDarkMode: systemPrefersDark });
      }
    } else {
      set({ isDarkMode: theme === 'dark' });
    }
  },
  
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  clearSearchQuery: () => set({ searchQuery: '' }),
});