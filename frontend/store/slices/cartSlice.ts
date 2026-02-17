import { StateCreator } from 'zustand';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  slug?: string;
}

export interface CartSlice {
  cart: CartItem[];
  isCartOpen: boolean;
  
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const createCartSlice: StateCreator<CartSlice> = (set, get) => ({
  cart: [],
  isCartOpen: false,
  
  addToCart: (product) => {
    const { cart } = get();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      });
    } else {
      set({ cart: [...cart, { ...product, quantity: 1 }] });
    }
  },
  
  removeFromCart: (productId) => {
    const { cart } = get();
    set({ cart: cart.filter(item => item.id !== productId) });
  },
  
  updateCartQuantity: (productId, quantity) => {
    const { cart } = get();
    
    if (quantity <= 0) {
      set({ cart: cart.filter(item => item.id !== productId) });
    } else {
      set({
        cart: cart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      });
    }
  },
  
  clearCart: () => set({ cart: [] }),
  
  getCartTotal: () => {
    const { cart } = get();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  },
  
  getCartCount: () => {
    const { cart } = get();
    return cart.reduce((count, item) => count + item.quantity, 0);
  },
  
  toggleCart: () => set(state => ({ isCartOpen: !state.isCartOpen })),
  
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
});