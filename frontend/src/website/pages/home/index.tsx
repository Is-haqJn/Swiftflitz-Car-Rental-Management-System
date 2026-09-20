// import { ROUTES } from '@/shared/routes';
import { useState } from 'react';
import {
    HeroSection,
    SearchSection,
    AboutSection,
    CounterSection,
    ListingSection,
    CategoriesSection,
    ChauffeurSection,
    PickupProcessSection,
    TestimonialSection,
    WhyChooseUsSection,
} from './sections';
import { AnnouncementPopup } from './sections/AnnouncementPopup';
import { PromoPopup } from './sections/PromoPopup';
import { useTitle } from '@/shared/hooks';
import { usePopupSettings } from '@/shared/hooks/queries/useSettings';

type ActivePopup = 'announcement' | 'promo' | null;

const Home = () => {
    const title = useTitle('Home');
    const { data: popupRes } = usePopupSettings();
    const popupSettings = popupRes?.data;

    const announcementEnabled = popupSettings?.announcement_enabled ?? false;
    const promoEnabled = popupSettings?.promo_enabled ?? false;

    const initialPopup: ActivePopup = announcementEnabled
        ? 'announcement'
        : promoEnabled
          ? 'promo'
          : null;

    const [activePopup, setActivePopup] = useState<ActivePopup | 'init'>(
        'init'
    );

    const resolvedPopup: ActivePopup =
        activePopup === 'init' ? initialPopup : activePopup;

    const handleAnnouncementDismiss = () => {
        setActivePopup(promoEnabled ? 'promo' : null);
    };

    const handlePromoDismiss = () => {
        setActivePopup(null);
    };

    return (
        <>
            {title}
            <HeroSection />
            <SearchSection />
            <CategoriesSection />
            <ListingSection />
            <AboutSection />
            <WhyChooseUsSection />
            <ChauffeurSection />
            <PickupProcessSection />
            <TestimonialSection />
            <CounterSection />

            {popupSettings &&
                resolvedPopup === 'announcement' &&
                announcementEnabled && (
                    <AnnouncementPopup
                        settings={popupSettings}
                        onDismiss={handleAnnouncementDismiss}
                    />
                )}

            {popupSettings && resolvedPopup === 'promo' && promoEnabled && (
                <PromoPopup
                    settings={popupSettings}
                    onDismiss={handlePromoDismiss}
                />
            )}
        </>
    );
};

export default Home;
