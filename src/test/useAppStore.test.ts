import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

// Grab the raw store without React context for unit-level testing
const getStore = () => useAppStore.getState();

describe('useAppStore', () => {
    beforeEach(() => {
        // Reset store state before each test
        getStore().resetStore();
    });

    it('initializes with correct default state', () => {
        const state = getStore();
        expect(state.clientData).toBeNull();
        expect(state.waterTotal).toBe(0);
        expect(state.cleaningTotal).toBe(0);
        expect(state.isExpired).toBe(false);
    });

    it('setClientData updates clientData in the store', () => {
        const mockClient = {
            id: 'test-id-123',
            name: 'John Doe',
            spouseName: 'Jane',
            lang: 'en' as const,
            email: 'john@example.com',
            phone: '555-1234',
            zipCode: '19103',
            status: 'LEAD' as const,
            observations: [],
            referrals: [],
            analyst: 'analyst@aquafeel.com',
            createdAt: new Date().toISOString(),
        };

        getStore().setClientData(mockClient);
        expect(getStore().clientData?.name).toBe('John Doe');
        expect(getStore().clientData?.email).toBe('john@example.com');
    });

    it('setClientData can set client to null', () => {
        getStore().setClientData({ id: 'x', name: 'Test' } as any);
        getStore().setClientData(null);
        expect(getStore().clientData).toBeNull();
    });

    it('setWaterTotal updates waterTotal correctly', () => {
        getStore().setWaterTotal(125.50);
        expect(getStore().waterTotal).toBe(125.50);
    });

    it('setCleaningTotal updates cleaningTotal correctly', () => {
        getStore().setCleaningTotal(88);
        expect(getStore().cleaningTotal).toBe(88);
    });

    it('setIsExpired toggles the expiration flag', () => {
        getStore().setIsExpired(true);
        expect(getStore().isExpired).toBe(true);

        getStore().setIsExpired(false);
        expect(getStore().isExpired).toBe(false);
    });

    it('resetStore clears all state back to defaults', () => {
        // Set some values first
        getStore().setWaterTotal(200);
        getStore().setCleaningTotal(100);
        getStore().setIsExpired(true);

        // Reset and verify
        getStore().resetStore();
        expect(getStore().waterTotal).toBe(0);
        expect(getStore().cleaningTotal).toBe(0);
        expect(getStore().isExpired).toBe(false);
        expect(getStore().clientData).toBeNull();
    });
});
