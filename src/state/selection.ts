import { create } from "zustand";

type SelState = {
  selected: Set<string>;
  lastIndex: number | null;
  toggle: (id: string, index?: number, shift?: boolean, currentPageIds?: string[]) => void;
  setMany: (ids: string[]) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  count: () => number;
};

export const useSelection = create<SelState>((set, get) => ({
  selected: new Set(),
  lastIndex: null,
  toggle: (id, index, shift, pageIds = []) =>
    set((s) => {
      const next = new Set(s.selected);
      if (shift && s.lastIndex != null && index != null && pageIds.length) {
        const [a, b] = [s.lastIndex, index].sort((x, y) => x - y);
        for (let i = a; i <= b; i++) {
          if (pageIds[i]) next.add(pageIds[i]);
        }
      } else {
        next.has(id) ? next.delete(id) : next.add(id);
      }
      return { selected: next, lastIndex: index ?? s.lastIndex };
    }),
  setMany: (ids) => set({ selected: new Set(ids) }),
  clear: () => set({ selected: new Set(), lastIndex: null }),
  isSelected: (id) => get().selected.has(id),
  count: () => get().selected.size,
}));