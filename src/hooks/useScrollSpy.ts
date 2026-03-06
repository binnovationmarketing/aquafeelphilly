import { useState, useEffect, useCallback } from 'react';

export function useScrollSpy(sections: string[], initialSection: string = 'hero', offsetPixels: number = 300) {
    const [currentSection, setCurrentSection] = useState(initialSection);

    useEffect(() => {
        const handleScroll = () => {
            for (const section of sections) {
                const element = document.getElementById(section);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    // Adjust threshold based on screen position
                    if (rect.top >= 0 && rect.top < offsetPixels) {
                        setCurrentSection(section);
                        break;
                    }
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [sections, offsetPixels]);

    const handleNavigate = useCallback((id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setCurrentSection(id);
        }
    }, []);

    return { currentSection, handleNavigate };
}
