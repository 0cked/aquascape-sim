import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QualityPreset = 'low' | 'medium' | 'high';
export type AoQuality = 'off' | 'low' | 'high';

export type QualityState = {
  preset: QualityPreset;
  dprMax: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  postprocessingEnabled: boolean;
  aoQuality: AoQuality;

  setPreset: (preset: QualityPreset) => void;
};

type PresetConfig = Pick<
  QualityState,
  'preset' | 'dprMax' | 'shadowsEnabled' | 'shadowMapSize' | 'postprocessingEnabled' | 'aoQuality'
>;

const PRESETS: Record<QualityPreset, Omit<PresetConfig, 'preset'>> = {
  low: {
    dprMax: 1.25,
    shadowsEnabled: false,
    shadowMapSize: 0,
    postprocessingEnabled: false,
    aoQuality: 'off',
  },
  medium: {
    dprMax: 1.5,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    postprocessingEnabled: true,
    aoQuality: 'low',
  },
  high: {
    dprMax: 1.75,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    postprocessingEnabled: true,
    aoQuality: 'high',
  },
};

function applyPreset(preset: QualityPreset): PresetConfig {
  return { preset, ...PRESETS[preset] };
}

export const useQualityStore = create<QualityState>()(
  persist(
    (set) => ({
      ...applyPreset('high'),
      setPreset: (preset) => {
        set(applyPreset(preset));
      },
    }),
    {
      name: 'aquascapesim-quality-v1',
      version: 1,
      partialize: (s) => ({
        preset: s.preset,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== 'object') return currentState;
        const raw = (persistedState as Record<string, unknown>).preset;
        const preset = raw === 'low' || raw === 'medium' || raw === 'high' ? raw : null;
        return preset ? { ...currentState, ...applyPreset(preset) } : currentState;
      },
    }
  )
);
