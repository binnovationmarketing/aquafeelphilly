import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollSpy } from '../../src/hooks/useScrollSpy';

// Helper to create a fake DOM section at a given position
function createSection(id: string, top: number) {
    const el = document.createElement('div');
    el.id = id;
    el.getBoundingClientRect = () => ({
        top,
        bottom: top + 200,
        left: 0,
        right: 100,
        width: 100,
        height: 200,
        x: 0,
        y: top,
        toJSON: () => { },
    });
    document.body.appendChild(el);
    return el;
}

describe('useScrollSpy', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('initializes with the provided initial section', () => {
        const { result } = renderHook(() =>
            useScrollSpy(['hero', 'logic', 'proposal'], 'hero', 300)
        );
        expect(result.current.currentSection).toBe('hero');
    });

    it('returns a handleNavigate function', () => {
        const { result } = renderHook(() =>
            useScrollSpy(['hero', 'logic'], 'hero', 300)
        );
        expect(typeof result.current.handleNavigate).toBe('function');
    });

    it('handleNavigate updates currentSection and calls scrollIntoView', () => {
        const el = createSection('logic', 0);
        const scrollSpy = vi.fn();
        el.scrollIntoView = scrollSpy;

        const { result } = renderHook(() =>
            useScrollSpy(['hero', 'logic'], 'hero', 300)
        );

        act(() => {
            result.current.handleNavigate('logic');
        });

        expect(result.current.currentSection).toBe('logic');
        expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' });
    });

    it('does not crash when navigating to a non-existent section', () => {
        const { result } = renderHook(() =>
            useScrollSpy(['hero', 'logic'], 'hero', 300)
        );

        act(() => {
            // section 'ghost' doesn't exist in the DOM
            result.current.handleNavigate('ghost');
        });

        // Should remain at previous value
        expect(result.current.currentSection).toBe('hero');
    });

    it('cleans up scroll event listener on unmount', () => {
        const removeSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() =>
            useScrollSpy(['hero', 'logic'], 'hero', 300)
        );

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
});
