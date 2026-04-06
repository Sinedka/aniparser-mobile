import { create } from 'zustand';

export type PanelView = 'player' | 'dubber' | 'episode';

type PlayerPanelState = {
  panelView: PanelView;
  setPanelView: (view: PanelView) => void;
};

export const usePlayerPanelStore = create<PlayerPanelState>(set => ({
  panelView: 'player',
  setPanelView: view => set({ panelView: view }),
}));
