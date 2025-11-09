"use client";
import { create } from "zustand";

type Layout = any; // later we will replace with real schema

type LayoutStore = {
  layout: Layout;
  setLayout: (layout: Layout) => void;
};

export const useLayoutStore = create<LayoutStore>((set) => ({
  layout: {
    type: "page",
    children: [],
  },
  setLayout: (layout) => set({ layout }),
}));
