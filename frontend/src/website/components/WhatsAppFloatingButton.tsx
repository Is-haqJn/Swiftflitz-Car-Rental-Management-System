import { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useContactSettings } from '@/shared/hooks/queries/useSettings';

/* The website's scroll-to-top button (.scroltop) appears when scrollY > 900.
   When it is visible we shift the WhatsApp button left so they don't overlap. */
const SCROLL_THRESHOLD = 900;

export function WhatsAppFloatingButton() {
    const { data: contactRes } = useContactSettings();
    const phone = contactRes?.data?.whatsapp_number;

    const [scrollArrowVisible, setScrollArrowVisible] = useState(false);

    useEffect(() => {
        function onScroll() {
            setScrollArrowVisible(window.scrollY > SCROLL_THRESHOLD);
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (!phone) return null;

    const rightOffset = scrollArrowVisible ? '4.5rem' : '1rem';

    return (
        <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: rightOffset,
                zIndex: 9999,
                width: '3rem',
                height: '3rem',
                background: '#25D366',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'right 0.3s ease',
                textDecoration: 'none',
                color: '#fff',
            }}
        >
            <FaWhatsapp size={24} />
        </a>
    );
}
