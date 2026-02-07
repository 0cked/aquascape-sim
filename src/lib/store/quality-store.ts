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
  autoDegradeEnabled: boolean;
  autoNotice: string | null;

  setPreset: (preset: QualityPreset) => void;
  setAutoDegradeEnabled: (enabled: boolean) => void;
  setAutoNotice: (message: string | null) => void;
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
      autoDegradeEnabled: true,
      autoNotice: null,
      setPreset: (preset) => {
        set((s) => ({ ...s, ...applyPreset(preset), autoNotice: null }));
      },
      setAutoDegradeEnabled: (enabled) => {
        set((s) => ({ ...s, autoDegradeEnabled: enabled }));
      },
      setAutoNotice: (message) => {
        set((s) => ({ ...s, autoNotice: message }));
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
