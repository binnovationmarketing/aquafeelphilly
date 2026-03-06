import { create } from 'zustand';
import { ClientData } from '../../types';

interface AppState {
    // Global Proposal Context
    clientData: ClientData | null;
    waterTotal: number;
    cleaningTotal: number;
    isExpired: boolean;

    // Actions
    setClientData: (data: ClientData | null) => void;
    setWaterTotal: (total: number) => void;
    setCleaningTotal: (total: number) => void;
    setIsExpired: (expired: boolean) => void;

    // Quick clear for logout/new lead
    resetStore: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
    clientData: null,
    waterTotal: 0,
    cleaningTotal: 0,
    isExpired: false,

    setClientData: (data) => set({ clientData: data }),
    setWaterTotal: (total) => set({ waterTotal: total }),
    setCleaningTotal: (total) => set({ cleaningTotal: total }),
    setIsExpired: (expired) => set({ isExpired: expired }),

    resetStore: () => set({
        clientData: null,
        waterTotal: 0,
        cleaningTotal: 0,
        isExpired: false
    }),
}));
