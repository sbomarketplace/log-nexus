import { create } from "zustand";

type PinState = {
  pinned: string[];                        // maintain pin order
  isPinned: (id: string) => boolean;
  toggle: (id: string) => void;            // pin → top, unpin → normal
  orderWithPins: <T extends { id: string }>(items: T[]) => T[];
};

export const usePin = create<PinState>((set, get) => ({
  pinned: [],
  isPinned: (id) => get().pinned.includes(id),
  toggle: (id) =>
    set((s) => {
      const idx = s.pinned.indexOf(id);
      if (idx >= 0) {
        // unpin
        const next = s.pinned.slice();
        next.splice(idx, 1);
        return { pinned: next };
      } else {
        // pin (append to end => shows below earlier pins)
        return { pinned: [...s.pinned, id] };
      }
    }),
  orderWithPins: (items) => {
    const p = get().pinned;
    if (!p.length) return items;
    const map = new Map(items.map((it) => [it.id, it]));
    const pinnedFirst = p.map((id) => map.get(id)).filter(Boolean) as typeof items;
    const rest = items.filter((it) => !p.includes(it.id));
    return [...pinnedFirst, ...rest];
  },
}));