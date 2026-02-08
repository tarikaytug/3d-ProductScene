import { create } from "zustand";

/* ——————————————————————————————————————————————
   Types
   —————————————————————————————————————————————— */

export type Category = "body" | "keycaps" | "switches";

export interface ConfigOption {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface CategoryInfo {
  id: Category;
  label: string;
  subtitle: string;
}

/* ——————————————————————————————————————————————
   Static Data – Kategoriler & Seçenekler
   —————————————————————————————————————————————— */

export const CATEGORIES: CategoryInfo[] = [
  { id: "body", label: "Gövde", subtitle: "Kasa Rengi" },
  { id: "keycaps", label: "Tuşlar", subtitle: "Keycap Seti" },
  { id: "switches", label: "Switch", subtitle: "Anahtar Türü" },
];

export const OPTIONS: Record<Category, ConfigOption[]> = {
  body: [
    { id: "midnight", name: "Midnight Black", color: "#1a1a2e" },
    { id: "silver", name: "Space Silver", color: "#8d8d92" },
    { id: "arctic", name: "Arctic White", color: "#e8e6e3" },
    { id: "navy", name: "Navy Blue", color: "#1e3a5f" },
    { id: "burgundy", name: "Burgundy Red", color: "#722f37" },
    { id: "forest", name: "Forest Green", color: "#1b4332" },
    { id: "rose", name: "Rose Gold", color: "#b76e79" },
  ],
  keycaps: [
    { id: "charcoal", name: "Charcoal", color: "#2d2d2d" },
    { id: "cream", name: "Cream White", color: "#f5f0e8" },
    { id: "matcha", name: "Retro Matcha", color: "#7d9b76" },
    { id: "lavender", name: "Lavender Haze", color: "#b8a9c9" },
    { id: "coral", name: "Coral Pink", color: "#e07a5f" },
    { id: "sky", name: "Sky Blue", color: "#87ceeb" },
    { id: "sunset", name: "Sunset Orange", color: "#f4845f" },
  ],
  switches: [
    {
      id: "red",
      name: "Cherry MX Red",
      color: "#e63946",
      description: "Linear · 45g · Sessiz",
    },
    {
      id: "blue",
      name: "Cherry MX Blue",
      color: "#457b9d",
      description: "Clicky · 50g · Tıkırtılı",
    },
    {
      id: "brown",
      name: "Cherry MX Brown",
      color: "#8b5e3c",
      description: "Tactile · 45g · Dokunsal",
    },
    {
      id: "speed",
      name: "Speed Silver",
      color: "#adb5bd",
      description: "Linear · 45g · Hızlı",
    },
    {
      id: "black",
      name: "Cherry MX Black",
      color: "#212529",
      description: "Linear · 60g · Ağır",
    },
  ],
};

/* ——————————————————————————————————————————————
   Store
   —————————————————————————————————————————————— */

interface ConfiguratorState {
  activeCategory: Category;
  bodyColor: string;
  keycapColor: string;
  switchColor: string;
  selectedOptions: Record<Category, string>;
  soundEnabled: boolean;

  setActiveCategory: (category: Category) => void;
  selectOption: (category: Category, optionId: string) => void;
  toggleSound: () => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set) => ({
  activeCategory: "body",
  bodyColor: OPTIONS.body[0].color,
  keycapColor: OPTIONS.keycaps[0].color,
  switchColor: OPTIONS.switches[0].color,
  selectedOptions: {
    body: OPTIONS.body[0].id,
    keycaps: OPTIONS.keycaps[0].id,
    switches: OPTIONS.switches[0].id,
  },
  soundEnabled: true,

  setActiveCategory: (category) => set({ activeCategory: category }),

  selectOption: (category, optionId) => {
    const option = OPTIONS[category].find((o) => o.id === optionId);
    if (!option) return;

    set((state) => ({
      selectedOptions: { ...state.selectedOptions, [category]: optionId },
      ...(category === "body" && { bodyColor: option.color }),
      ...(category === "keycaps" && { keycapColor: option.color }),
      ...(category === "switches" && { switchColor: option.color }),
    }));
  },

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
}));
