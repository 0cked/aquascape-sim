import { create } from 'zustand';

export type InstancingState = {
  readyAssetTypes: Record<string, true>;
  markReady: (assetType: string) => void;
};

export const useInstancingStore = create<InstancingState>((set) => ({
  readyAssetTypes: {},
  markReady: (assetType) => {
    set((s) => {
      if (s.readyAssetTypes[assetType] === true) return s;
      return { ...s, readyAssetTypes: { ...s.readyAssetTypes, [assetType]: true } };
    });
  },
}));

