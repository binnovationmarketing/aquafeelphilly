import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { ClientData } from '../../types';

export function useProposalInit() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const setClientData = useAppStore((state: any) => state.setClientData);
    const clientData = useAppStore((state: any) => state.clientData);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const urlName = searchParams.get('n') || searchParams.get('name');
        const urlSpouse = searchParams.get('s') || searchParams.get('spouse');
        const urlLang = searchParams.get('l') || searchParams.get('lang');
        const urlEmail = searchParams.get('e') || searchParams.get('email');
        const urlZip = searchParams.get('z') || searchParams.get('zip');

        if (urlName) {
            const selectedLang = (urlLang === 'en' || urlLang === 'es' || urlLang === 'pt') ? urlLang : 'pt';
            const data: ClientData = {
                id: crypto.randomUUID(),
                name: urlName,
                spouseName: urlSpouse || '',
                lang: selectedLang as any,
                email: urlEmail || '',
                phone: '',
                zipCode: urlZip || '',
                status: 'LEAD',
                observations: [],
                referrals: [],
                analyst: 'System',
                createdAt: new Date().toISOString()
            };

            setClientData(data);
            localStorage.setItem('proposalClientData', JSON.stringify(data));
            setIsLoaded(true);
        } else {
            const storedClient = localStorage.getItem('proposalClientData');
            if (storedClient) {
                try {
                    const parsed = JSON.parse(storedClient);
                    if (parsed && parsed.name) {
                        setClientData(parsed);
                        setIsLoaded(true);
                    } else {
                        navigate('/dashboard/analyst');
                    }
                } catch (e) {
                    localStorage.removeItem('proposalClientData');
                    navigate('/dashboard/analyst');
                }
            } else {
                navigate('/dashboard/analyst');
            }
        }
    }, [searchParams, navigate, setClientData]);

    return { isLoaded, clientData };
}
