import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type NotifySeverity = 'success' | 'error' | 'warning' | 'info';
export interface NotifyPosition {
  vertical: 'top' | 'bottom';
  horizontal: 'left' | 'center' | 'right';
}

interface NotifyConfig {
  content: string;
  title?: string;
  severity?: NotifySeverity;
  duration?: number;
  position?: NotifyPosition;
}

interface NotifyState {
  open: boolean;
  content: string;
  title: string;
  severity: NotifySeverity;
  duration: number;
  position: NotifyPosition;
}

interface NotifyActions {
  showNoty: (config: NotifyConfig) => void;
  close: () => void;
}

export type NotifyStore = NotifyState & NotifyActions;

const DEFAULT_POSITION: NotifyPosition = { vertical: 'top', horizontal: 'center' };

const initialState: NotifyState = {
  open: false,
  content: '',
  title: '',
  severity: 'success',
  duration: 4000,
  position: DEFAULT_POSITION,
};

export const useNotifyStore = create<NotifyStore>()(
  devtools(
    set => ({
      ...initialState,

      showNoty: ({ content, title = '', severity = 'success', duration = 4000, position = DEFAULT_POSITION }) => {
        set({ open: true, content, title, severity, duration, position }, false, 'showNoty');
      },

      close: () => set({ open: false }, false, 'close'),
    }),
    { name: 'NotifyStore' },
  ),
);

export const showNotify = (config: NotifyConfig) => useNotifyStore.getState().showNoty(config);
export const closeNotify = () => useNotifyStore.getState().close();
