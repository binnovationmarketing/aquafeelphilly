import { useState, useEffect } from 'react';

interface TimeLeft {
    hours: number;
    minutes: number;
    seconds: number;
}

export function useCountdownTimer(storageKey: string, expirationHours: number = 48) {
    const [expirationDate, setExpirationDate] = useState<Date | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

    // Initialize Timer Source
    useEffect(() => {
        const storedStartDate = localStorage.getItem(storageKey);
        let startDate: Date;

        if (storedStartDate) {
            const parsedDate = new Date(parseInt(storedStartDate));
            const now = new Date();
            const diffInDays = (now.getTime() - parsedDate.getTime()) / (1000 * 60 * 60 * 24);
            // Reset if older than 15 days
            startDate = diffInDays > 15 ? new Date() : parsedDate;
        } else {
            startDate = new Date();
        }

        localStorage.setItem(storageKey, startDate.getTime().toString());
        const expDate = new Date(startDate.getTime() + (expirationHours * 60 * 60 * 1000));
        setExpirationDate(expDate);
    }, [storageKey, expirationHours]);

    // Handle Tick Update
    useEffect(() => {
        if (!expirationDate) return;

        const updateTimer = () => {
            const now = new Date();
            const difference = expirationDate.getTime() - now.getTime();

            if (difference <= 0) {
                setIsExpired(true);
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
            } else {
                setIsExpired(false);
                setTimeLeft({
                    hours: Math.floor((difference / (1000 * 60 * 60))),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [expirationDate]);

    return { expirationDate, isExpired, timeLeft };
}
