import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdownTimer } from '../../src/hooks/useCountdownTimer';

const STORAGE_KEY = 'testTimer';

describe('useCountdownTimer', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        localStorage.clear();
    });

    it('initializes expirationDate from localStorage and starts counting', () => {
        // Start timer from NOW
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        const { result } = renderHook(() => useCountdownTimer(STORAGE_KEY, 48));

        act(() => { vi.advanceTimersByTime(1000); });

        // Should have roughly ~48h remaining
        expect(result.current.timeLeft.hours).toBeGreaterThanOrEqual(47);
        expect(result.current.isExpired).toBe(false);
    });

    it('saves expirationDate key in localStorage after mounting', () => {
        renderHook(() => useCountdownTimer(STORAGE_KEY, 48));

        // Advance just enough to let the useEffect mount
        act(() => { vi.advanceTimersByTime(100); });

        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
    });

    it('sets isExpired=false when time remains', () => {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        const { result } = renderHook(() => useCountdownTimer(STORAGE_KEY, 48));
        act(() => { vi.advanceTimersByTime(1000); });
        expect(result.current.isExpired).toBe(false);
    });

    it('sets isExpired=true when expirationDate has passed', () => {
        // Set start date to 49 hours ago
        const fortyNineHoursAgo = Date.now() - 49 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, fortyNineHoursAgo.toString());

        const { result } = renderHook(() => useCountdownTimer(STORAGE_KEY, 48));
        act(() => { vi.advanceTimersByTime(1000); });

        expect(result.current.isExpired).toBe(true);
        expect(result.current.timeLeft).toEqual({ hours: 0, minutes: 0, seconds: 0 });
    });

    it('resets start date if stored date is older than 15 days', () => {
        // Set a date 16 days ago
        const sixteenDaysAgo = Date.now() - 16 * 24 * 60 * 60 * 1000;
        localStorage.setItem(STORAGE_KEY, sixteenDaysAgo.toString());
        const beforeMount = Date.now();

        renderHook(() => useCountdownTimer(STORAGE_KEY, 48));
        act(() => { vi.advanceTimersByTime(100); });

        const storedValue = parseInt(localStorage.getItem(STORAGE_KEY) || '0');
        // Should be a fresh timestamp close to now
        expect(storedValue).toBeGreaterThanOrEqual(beforeMount - 100);
    });
});
