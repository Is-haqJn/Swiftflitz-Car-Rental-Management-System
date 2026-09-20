import { useTitle } from '@/shared/hooks';
import {
    BannerSection,
    WhyChooseUs,
    ServiceFacilitiesSection,
} from './sections';

export const AllServices = () => {
    const title = useTitle('All Services');
    return (
        <>
            {title}
            <BannerSection />
            <ServiceFacilitiesSection />
            <WhyChooseUs />
        </>
    );
};
