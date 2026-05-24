import { create } from 'zustand';

type Density = 'comfortable' | 'compact';
const DENSITY_KEY = 'coreHRM_density';

interface DensityState {
  density: Density;
  setDensity: (d: Density) => void;
}

export const useDensity = create<DensityState>((set) => ({
  density: (typeof window !== 'undefined'
    ? (localStorage.getItem(DENSITY_KEY) as Density) || 'comfortable'
    : 'comfortable'),

  setDensity: (density: Density) => {
    localStorage.setItem(DENSITY_KEY, density);
    set({ density });
  },
}));
