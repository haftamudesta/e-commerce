import { StateCreator } from 'zustand';
import { CartSlice } from './slices/cartSlice';
import { FavoriteSlice } from './slices/favoriteSlice';
import { UISlice } from './slices/uiSlice';
import { PersistOptions, devtools } from 'zustand/middleware';

export type StoreState = CartSlice & FavoriteSlice & UISlice;

export type SliceCreator<T> = StateCreator<
  StoreState,
  [['zustand/persist', unknown], ['zustand/devtools', never]],
  [],
  T
>;

export type PersistConfig = PersistOptions<StoreState>;

export type StoreType = StoreState;