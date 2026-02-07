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
  fogEnabled: boolean;
  causticsEnabled: boolean;
  godRaysEnabled: boolean;
  autoDegradeEnabled: boolean;
  autoNotice: string | null;

  setPreset: (preset: QualityPreset) => void;
  setFogEnabled: (enabled: boolean) => void;
  setCausticsEnabled: (enabled: boolean) => void;
  setGodRaysEnabled: (enabled: boolean) => void;
  setAutoDegradeEnabled: (enabled: boolean) => void;
  setAutoNotice: (message: string | null) => void;
};

type PresetConfig = Pick<
  QualityState,
  'preset' | 'dprMax' | 'shadowsEnabled' | 'shadowMapSize' | 'postprocessingEnabled' | 'aoQuality'
  | 'fogEnabled'
  | 'causticsEnabled'
  | 'godRaysEnabled'
>;

const PRESETS: Record<QualityPreset, Omit<PresetConfig, 'preset'>> = {
  low: {
    dprMax: 1.25,
    shadowsEnabled: false,
    shadowMapSize: 0,
    postprocessingEnabled: false,
    aoQuality: 'off',
    fogEnabled: false,
    causticsEnabled: false,
    godRaysEnabled: false,
  },
  medium: {
    dprMax: 1.5,
    shadowsEnabled: true,
    shadowMapSize: 1024,
    postprocessingEnabled: true,
    aoQuality: 'low',
    fogEnabled: true,
    causticsEnabled: false,
    godRaysEnabled: false,
  },
  high: {
    dprMax: 1.75,
    shadowsEnabled: true,
    shadowMapSize: 2048,
    postprocessingEnabled: true,
    aoQuality: 'high',
    fogEnabled: true,
    causticsEnabled: true,
    godRaysEnabled: true,
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
      setFogEnabled: (enabled) => {
        set((s) => ({ ...s, fogEnabled: enabled }));
      },
      setCausticsEnabled: (enabled) => {
        set((s) => ({ ...s, causticsEnabled: enabled }));
      },
      setGodRaysEnabled: (enabled) => {
        set((s) => ({ ...s, godRaysEnabled: enabled }));
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
