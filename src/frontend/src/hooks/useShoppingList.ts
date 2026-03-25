import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  estimatedPrice?: number;
  bought: boolean;
  createdAt: number;
}

interface ShoppingListStore {
  items: ShoppingItem[];
  addItem: (name: string, category: string, estimatedPrice?: number) => void;
  toggleBought: (id: string) => void;
  deleteItem: (id: string) => void;
  clearBought: () => void;
}

export const useShoppingList = create<ShoppingListStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (name, category, estimatedPrice) =>
        set((state) => ({
          items: [
            ...state.items,
            {
              id: crypto.randomUUID(),
              name,
              category,
              estimatedPrice,
              bought: false,
              createdAt: Date.now(),
            },
          ],
        })),
      toggleBought: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, bought: !item.bought } : item,
          ),
        })),
      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearBought: () =>
        set((state) => ({
          items: state.items.filter((item) => !item.bought),
        })),
    }),
    {
      name: "pe-tracker-shopping-list",
    },
  ),
);
