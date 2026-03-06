import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

// A component that throws an error for testing
const BrokenComponent = () => {
    throw new Error('Test error');
};

// A component that renders normally
const WorkingComponent = () => <p>Everything is fine</p>;

describe('ErrorBoundary', () => {
    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <WorkingComponent />
            </ErrorBoundary>
        );
        expect(screen.getByText('Everything is fine')).toBeInTheDocument();
    });

    it('renders fallback UI when a child throws', () => {
        // Suppress expected console.error from React's error boundary
        const consoleError = console.error;
        console.error = () => { };

        render(
            <ErrorBoundary>
                <BrokenComponent />
            </ErrorBoundary>
        );

        // Restore console.error
        console.error = consoleError;

        // The error boundary should show a fallback message
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
});
